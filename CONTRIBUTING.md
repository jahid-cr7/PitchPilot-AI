# Contributing to PitchPilot AI

Thank you for your interest in contributing! This guide will help you get started.

---

## How to Set Up the Project

1. **Fork the repository** on GitHub.

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/jahid-cr7/PitchPilot-AI.git
   cd PitchPilot-AI
   ```

3. **Create a virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Linux/macOS
   # .venv\Scripts\activate    # Windows
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the app** to verify everything works:
   ```bash
   streamlit run app.py
   ```

---

## How to Create a Branch

Always create a new branch for your changes. Do not commit directly to `main`.

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bugfix-name
```

Use descriptive branch names, for example:
- `feature/add-media-pipe-pose-detection`
- `fix/speech-transcript-empty-handling`
- `docs/update-installation-guide`

---

## How to Run the App

After making changes, test them locally:

```bash
streamlit run app.py
```

Navigate through all pages (Practice, Feedback, Dashboard, History) to ensure your changes work correctly. If you added a new feature, try it in **Demo Mode** first.

---

## What NOT to Commit

Please ensure the following are never committed to the repository:

- ❌ **Secrets** — API keys, tokens, or credentials (use `.env` instead)
- ❌ **Videos** — Uploaded MP4 or other media files
- ❌ **Database files** — SQLite `.db` files in `data/`
- ❌ **Generated reports** — Files in `reports/generated/`
- ❌ **Virtual environments** — `.venv/`, `venv/`, or `env/` folders
- ❌ **Cache** — `__pycache__/`, `*.pyc`, `.pytest_cache/`
- ❌ **IDE files** — `.vscode/`, `.idea/`, `*.swp`

These are already listed in `.gitignore`, but double-check before committing.

---

## Pull Request Guidance

1. **Keep changes focused** — One feature or fix per pull request.
2. **Write clear commit messages** — Use present tense and be descriptive.
   - Good: `Add pause analysis to speech analyzer`
   - Bad: `fixed stuff`
3. **Update documentation** — If your change affects behavior, update `README.md` or relevant `docs/` files.
4. **Do not add new dependencies** without justification. If you must, update `requirements.txt` and explain why in the PR description.
5. **Test your changes** — Run the app and verify all pages still work.
6. **Fill out the PR template** (if one exists) with a clear description of what changed and why.

---

## Code Style

- Follow **PEP 8** for Python code.
- Use **type hints** where practical.
- Write **docstrings** for public functions and modules.
- Keep functions small and focused.

---

## Questions?

Open an issue on GitHub if you have questions, ideas, or need clarification on anything.

Happy contributing!
