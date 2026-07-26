#!/usr/bin/env python3
"""
StudyMate Video Generation Backend
Generates educational videos from scripts with text-to-speech narration

Requirements:
- moviepy
- google-cloud-texttospeech
- pillow
- requests

Install: pip install moviepy google-cloud-text-to-speech pillow requests
"""

import json
import sys
import os
from pathlib import Path
from typing import Optional
import tempfile
import requests
from datetime import datetime

try:
    from moviepy.editor import (
        TextClip,
        ImageClip,
        ColorClip,
        concatenate_videoclips,
        AudioFileClip,
        CompositeVideoClip,
    )
    from google.cloud import texttospeech
    from PIL import Image, ImageDraw
except ImportError as e:
    print(f"Error: Missing dependencies. Install with:")
    print("pip install moviepy google-cloud-text-to-speech pillow")
    sys.exit(1)


class VideoGenerator:
    def __init__(self, output_dir: str = "./generated_videos"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.tts_client = texttospeech.TextToSpeechClient()

    def generate_tts_audio(self, text: str, voice_name: str = "en-US-Neural2-C") -> str:
        """Generate audio from text using Google Text-to-Speech"""
        print(f"Generating TTS audio ({len(text)} chars)...")

        synthesis_input = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name=voice_name,  # Professional voice
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,  # Normal speed
        )

        response = self.tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # Save audio to temp file
        audio_file = self.output_dir / f"audio_{datetime.now().timestamp()}.mp3"
        with open(audio_file, "wb") as f:
            f.write(response.audio_content)

        print(f"✅ TTS audio saved: {audio_file}")
        return str(audio_file)

    def create_title_frame(self, title: str, duration: float = 3) -> ImageClip:
        """Create a title slide"""
        print(f"Creating title frame: {title}")

        # Create image with title
        img = Image.new("RGB", (1280, 720), color=(26, 102, 153))  # Blue background
        draw = ImageDraw.Draw(img)

        # Add title text
        title_font_size = 60
        try:
            from PIL import ImageFont

            font = ImageFont.load_default()
        except:
            font = None

        # Simple text rendering
        bbox = draw.textbbox((0, 0), title, font=font)
        text_width = bbox[2] - bbox[0]
        x = (1280 - text_width) // 2
        y = 360 - 30

        draw.text((x, y), title, fill=(255, 255, 255), font=font)

        # Save image
        img_file = self.output_dir / f"title_{datetime.now().timestamp()}.png"
        img.save(img_file)

        # Create clip
        return ImageClip(str(img_file)).set_duration(duration)

    def create_content_frame(self, text: str, duration: float = 5) -> ImageClip:
        """Create a content slide with text"""
        print(f"Creating content frame ({len(text)} chars)")

        # Create image with content
        img = Image.new("RGB", (1280, 720), color=(240, 240, 240))  # Light background
        draw = ImageDraw.Draw(img)

        # Add content text (wrapped)
        lines = text.split("\n")
        y_offset = 100
        line_height = 40

        try:
            from PIL import ImageFont

            font = ImageFont.load_default()
        except:
            font = None

        for line in lines[:10]:  # Limit to 10 lines
            draw.text((60, y_offset), line[:60], fill=(0, 0, 0), font=font)
            y_offset += line_height

        # Save image
        img_file = self.output_dir / f"content_{datetime.now().timestamp()}.png"
        img.save(img_file)

        # Create clip
        return ImageClip(str(img_file)).set_duration(duration)

    def generate_video(self, script: str, title: str, output_name: str = "output.mp4") -> str:
        """Generate complete video from script with TTS audio"""
        print(f"\n🎬 Starting video generation: {title}")

        # Clean script (remove [visual descriptions])
        narration = script.replace("[", "(").replace("]", ")")

        # Generate TTS audio
        audio_file = self.generate_tts_audio(narration)
        audio_clip = AudioFileClip(audio_file)
        audio_duration = audio_clip.duration

        # Create video clips
        clips = []

        # Add title
        title_clip = self.create_title_frame(title, duration=3)
        clips.append(title_clip)

        # Split script into sections and create frames
        sections = script.split("\n\n")
        remaining_duration = audio_duration - 3  # Subtract title duration

        if remaining_duration > 0 and sections:
            section_duration = remaining_duration / len(sections)

            for section in sections[:int(remaining_duration / 2)]:  # Limit sections
                if section.strip():
                    frame = self.create_content_frame(section, duration=min(section_duration, 5))
                    clips.append(frame)

        if not clips:
            print("Warning: No clips created, using title only")
            clips = [self.create_title_frame(title, duration=audio_duration)]

        # Concatenate video clips
        print("Concatenating video clips...")
        video = concatenate_videoclips(clips)

        # Add audio
        print("Adding audio track...")
        video = video.set_audio(audio_clip)

        # Write video file
        output_path = self.output_dir / output_name
        print(f"Writing video to {output_path}...")
        video.write_videofile(str(output_path), verbose=False, logger=None, codec="libx264")

        print(f"✅ Video generated successfully: {output_path}")

        # Cleanup temp files
        audio_clip.close()
        video.close()

        return str(output_path)


def main():
    """CLI interface for video generation"""
    if len(sys.argv) < 2:
        print("Usage: python video_generator.py <script_json>")
        print("Example: python video_generator.py '{\"title\": \"Eigenvalues\", \"script\": \"...\"}' ")
        sys.exit(1)

    # Parse input
    input_data = json.loads(sys.argv[1])

    title = input_data.get("title", "Study Video")
    script = input_data.get("script", "")
    output_name = input_data.get("output_name", f"{title.replace(' ', '_')}.mp4")

    if not script:
        print("Error: Script is empty")
        sys.exit(1)

    # Generate video
    generator = VideoGenerator()
    try:
        video_path = generator.generate_video(script, title, output_name)
        print(json.dumps({"success": True, "video_path": video_path}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
