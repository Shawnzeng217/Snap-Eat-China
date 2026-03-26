<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Snap-Eat AI 🍲

Snap-Eat is a premium AI-powered culinary companion designed for international travelers and food enthusiasts. It leverages advanced vision models and OCR to bridge the language gap in dining experiences, providing instant dish identification, nutritional insights, and allergen safety alerts.

## 🚀 Core Architecture: AI + OCR Hybrid

Snap-Eat distinguishes itself with a **Hybrid Analysis Engine**:
1.  **AI Vision (Qwen3-Omni-Flash):** Uses Alibaba's state-of-the-art `qwen3-omni-flash` model via the DashScope API. It performs deep semantic analysis of food photos and menu text, identifying dishes, ingredients, and flavor profiles.
2.  **Commercial-Grade OCR (Tesseract.js):** Acts as a high-precision layer to refine the AI's output. It extracts exact coordinates (Bounding Boxes) of text on menus, ensuring that dish identification is spatially accurate and robust.

---

## ✨ Key Features

- **📸 Dual Scanning Modes:**
    - **Food Scan:** Identifies real dishes from photos and analyzes visual features.
    - **Menu Scan:** Reads text-heavy menus and provides digital overlays for each item.
- **🛡️ Culinary Safety:** Deep-dive analysis of potential **Allergens** and **Spice Levels** using expert culinary knowledge.
- **🪪 Multilingual Chef Card:** Instantly generates a digital "Chef Card" in the local language, clearly communicating your dietary restrictions and allergies to restaurant staff.
- **🌍 Support for 11 Languages:** Full UI and analysis support for English, Chinese (Simplified/Traditional), Japanese, Korean, Spanish, French, Thai, Vietnamese, German, and Italian.
- **🏺 Smart History & Favorites:** Powered by **Supabase**, allowing users to save their culinary discoveries and maintain dietary profiles.
- **🎨 Premium UX/UI:** Featuring a dynamic dark/light theme, cinematic scan animations, and intuitive navigation.

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite (TypeScript)
- **AI Model:** Qwen3-Omni-Flash (Alibaba DashScope)
- **OCR:** Tesseract.js
- **Backend/Database:** Supabase
- **Visuals:** Framer Motion (Animations), Tailwind CSS / Vanilla CSS

---

## 💻 Get Started Locally

### Prerequisites
- Node.js (v18+)
- NPM or PNPM

### Installation

1.  **Clone & Install:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Create a `.env` file in the root directory (based on `.env.example`):
    ```env
    VITE_DASHSCOPE_API_KEY=your_dashscope_api_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    > [!TIP]
    > You can obtain an API key for Qwen via [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com/).

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

- `/components`: Core UI components (Scanning, Profile, Chef Card, etc.)
- `/lib`: Utility functions and Supabase configuration.
- `/constants.ts`: Language definitions and mock data.
- `App.tsx`: Main application logic and routing.
- `types.ts`: Shared TypeScript interfaces.
