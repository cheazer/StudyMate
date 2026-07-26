from google import genai

client = genai.Client()   # reads GEMINI_API_KEY from the environment

response = client.models.generate_content(
    model="gemma-4-26b-a4b-it",
    contents="Explain what a mixture-of-experts model is, in two sentences.",
)

print(response.text)