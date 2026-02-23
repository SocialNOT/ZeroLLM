# **App Name**: Aetheria AI

## Core Features:

- Dynamic Model Connection: Configure and connect to various self-hosted LLMs, like Ollama and LM Studio, through a central settings panel.  Includes fields for Base URL, API Key, Model ID, and Context Window Size.
- Persona Management: Create, save, and select custom system prompts to tailor the AI's behavior, acting as a tool.
- RAG Pipeline: Implement Retrieval-Augmented Generation by allowing users to upload documents (PDF, TXT, CSV), chunking them, generating embeddings, and storing them in a vector database.
- Configurable Embeddings: Allow users to choose their desired embedding model, which can also point to Ollama.
- Parameter Tuning UI: Sliders and selectors in the chat interface to adjust Temperature, Top_P, Max Tokens, and enforce output formats like Markdown or JSON.
- Workspace Management: Create and manage separate workspaces for different projects or knowledge bases, keeping data organized.
- API Proxy with Streaming: A dynamic API endpoint that accepts parameters, system prompt, and user message, then returns a Server-Sent Events (SSE) stream.

## Style Guidelines:

- Primary color: Deep indigo (#4B0082), representing intellect, sophistication, and a sense of premium quality suitable for professionals.
- Background color: Dark, desaturated bluish-gray (#212B36) to create a modern, dark-themed interface with minimal distraction.
- Accent color: Vibrant cyan (#00FFFF), positioned analogously to indigo, will be employed to add highlights to the interface and to create prominent call-to-action elements.
- Headline font: 'Space Grotesk' sans-serif font to maintain a computerized, techy, scientific feel.
- Body font: 'Inter' sans-serif font to keep a clean and objective appearance.
- Code font: 'Source Code Pro' monospaced font for clean and readable code snippets.
- Use minimalist, line-based icons from a professional icon set to convey a modern and clean aesthetic.
- Implement a sidebar-based layout for workspace navigation and chat history, ensuring a clear and organized user experience.
- Subtle animations and transitions, such as loading spinners and smooth content reveal, will be added to enhance user engagement without being intrusive.