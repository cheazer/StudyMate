#!/usr/bin/env python3
"""
StudyMate Manim video generation backend.

Renders a Gemma-generated Manim scene (see lib/gemma.ts:generateManimScene)
into an mp4 that the "turn this answer into a video" chat feature can play
back. Invoked as a subprocess from app/api/topics/[topicId]/video/route.ts,
same pattern as the older scripts/video_generator.py.

Requirements: manim (pulls in its own ffmpeg via imageio-ffmpeg).
Install: pip install manim

Usage: python generate_manim_video.py '{"code": "...", "className": "...", "outputName": "..."}'
Prints one JSON line to stdout: {"success": true, "video_path": "generated-videos/x.mp4"}
                             or {"success": false, "error": "..."}
"""

import json
import re
import sys
import shutil
import subprocess
import tempfile
from pathlib import Path

# Gemma is instructed to only ever emit `from manim import *`, but it's an LLM
# writing code that we then execute as a real subprocess — this is a second,
# independent check (the Node route does its own too) before that code ever
# touches disk. Reject anything that reaches past drawing shapes on screen.
ALLOWED_IMPORT_LINE = re.compile(r"^\s*from\s+manim\s+import\s+\*\s*$")

FORBIDDEN_PATTERNS = [
    r"__import__",
    r"\bopen\s*\(",
    r"\beval\s*\(",
    r"\bexec\s*\(",
    r"\bos\.",
    r"\bsys\.",
    r"\bsubprocess\b",
    r"\bsocket\b",
    r"\bshutil\b",
    r"\brequests\b",
    r"\bTex\s*\(",
    r"\bMathTex\s*\(",
]


def find_violation(code: str) -> str | None:
    # Every `import`/`from` line must be exactly `from manim import *` — this
    # doubles as the "no other imports" rule without also flagging that one
    # legitimate line (a naive "import" substring check can't tell the two
    # apart, since the allowed line contains the word too).
    for line in code.splitlines():
        if ("import" in line) and not ALLOWED_IMPORT_LINE.match(line):
            return f"disallowed import: {line.strip()!r}"

    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, code):
            return pattern
    return None


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: generate_manim_video.py <json>"}))
        sys.exit(1)

    input_data = json.loads(sys.argv[1])
    code = input_data.get("code", "")
    class_name = input_data.get("className", "")
    output_name = input_data.get("outputName", "video")

    if not code or not class_name:
        print(json.dumps({"success": False, "error": "code and className are required"}))
        sys.exit(1)

    # The Node route generates this (a random id), but sanitize defensively —
    # it ends up in a filesystem path both as a manim -o value and a
    # public_dir join, so anything path-traversal-shaped must not survive.
    output_name = re.sub(r"[^a-zA-Z0-9_-]", "", output_name) or "video"

    violation = find_violation(code)
    if violation:
        print(json.dumps({
            "success": False,
            "error": f"Generated scene contains a disallowed pattern ({violation}) and was not run.",
        }))
        sys.exit(1)

    repo_root = Path(__file__).resolve().parent.parent
    public_dir = repo_root / "public" / "generated-videos"
    public_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="manim_scene_") as tmp:
        tmp_path = Path(tmp)
        scene_file = tmp_path / "scene.py"
        scene_file.write_text(code, encoding="utf-8")

        media_dir = tmp_path / "media"
        cmd = [
            sys.executable, "-m", "manim",
            "-ql",  # low quality (480p15) — fast enough for an interactive chat feature
            "--media_dir", str(media_dir),
            "-o", output_name,
            str(scene_file),
            class_name,
        ]

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=180, cwd=str(tmp_path),
            )
        except subprocess.TimeoutExpired:
            print(json.dumps({"success": False, "error": "Rendering timed out after 180s"}))
            sys.exit(1)

        if result.returncode != 0:
            print(json.dumps({
                "success": False,
                "error": f"Manim render failed:\n{result.stderr[-2000:]}",
            }))
            sys.exit(1)

        rendered = list(media_dir.rglob(f"{output_name}.mp4"))
        if not rendered:
            print(json.dumps({"success": False, "error": "Render finished but no mp4 was produced"}))
            sys.exit(1)

        dest = public_dir / f"{output_name}.mp4"
        shutil.copyfile(rendered[0], dest)

    print(json.dumps({"success": True, "video_path": f"generated-videos/{output_name}.mp4"}))


if __name__ == "__main__":
    main()
