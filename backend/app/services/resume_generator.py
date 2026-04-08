"""
ATS Resume Screener - AI Resume Generator Service
Uses OpenAI to fill out a LaTeX template and compiles it to PDF using local pdflatex.
"""
import os
import tempfile
import subprocess
from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY

# Initialize async client if key exists
client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

async def generate_resume_latex(profile_text: str, custom_instructions: str = "") -> str:
    """
    Calls OpenAI to populate the provided LaTeX template with the user's data.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing. Cannot generate resume.")

    # Load the LaTeX template
    template_path = os.path.join(os.path.dirname(__file__), "..", "..", "template.txt")
    if not os.path.exists(template_path):
        raise FileNotFoundError("Could not find the LaTeX template file (template.txt).")
        
    with open(template_path, "r", encoding="utf-8") as f:
        latex_template = f.read()

    system_prompt = """
You are an expert Resume Generator.
Your task is to take the user's raw resume/profile data and strictly map it into the EXACT provided LaTeX template.

CRITICAL RULES:
1. You MUST use the exact preamble, layout, macros, and custom commands (e.g. \resumeSubheading, \resumeItem, \resumeProjectHeading) defined in the provided LATEX TEMPLATE.
2. DO NOT invent your own LaTeX structure or use a different resume template. Your output MUST be structurally identical to the provided template, starting with the exact same \documentclass and preamble.
3. Ensure you map the FULL LinkedIn URL (e.g. linkedin.com/in/username). Do NOT truncate or shorten any links!
4. Replace the sample data completely with the user's data. DO NOT summarize, compress, cut, or remove any Projects, Skills, or Experience entries to save space. You MUST include EVERY SINGLE ENTRY exactly as provided in the user's data.
5. ONLY return the final, complete LaTeX code. Do NOT wrap it in markdown block quotes (like ```latex). Start directly with \documentclass and end with \end{document}.
6. Make sure the LaTeX builds properly without syntax errors! Escape special LaTeX characters like %, &, $, _, #, {, } by prefixing with a backslash if they appear in the user's data.
"""

    instructions_block = f"\n\nUSER'S CUSTOM INSTRUCTIONS:\n{custom_instructions}\n(Please deeply integrate and follow these instructions while formatting and rewriting the resume content.)" if custom_instructions and custom_instructions.strip() else ""

    user_message = f"""
LATEX TEMPLATE:
{latex_template}


USER RESUME PROFILE TEXT:
{profile_text}{instructions_block}
"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
        )
        
        latex_code = response.choices[0].message.content.strip()
        # Clean up any potential markdown backticks just in case the AI ignored rule #1
        if latex_code.startswith("```"):
            lines = latex_code.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            latex_code = "\n".join(lines).strip()
            
        return latex_code

    except Exception as e:
        print(f"Error calling OpenAI for LaTeX generation: {e}")
        raise

async def generate_resume_pdf(profile_text: str, custom_instructions: str = "") -> bytes:
    """
    Generates the LaTeX code and compiles it to a PDF using pdflatex.
    Returns the binary content of the generated PDF.
    """
    latex_code = await generate_resume_latex(profile_text, custom_instructions)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save tex file
        tex_path = os.path.join(temp_dir, "resume.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_code)
            
        print("Compiling LaTeX to PDF...")
        # Run pdflatex command (run twice to resolve formatting like tables or page numbers, optionally once if no cross-references)
        
        # Determine pdflatex path
        pdflatex_cmd = "pdflatex"
        miktex_path = os.path.expanduser(r"~\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe")
        if os.path.exists(miktex_path):
            pdflatex_cmd = miktex_path

        try:
            # -interaction=nonstopmode prevents stopping on errors
            subprocess.run(
                [pdflatex_cmd, "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        except FileNotFoundError:
            raise RuntimeError(f"LaTeX compilation failed: '{pdflatex_cmd}' command not found. Please follow Setup instructions to install MiKTeX or TeX Live.")
        except subprocess.CalledProcessError as e:
            # If there's an error, it might still have produced a PDF, but log it
            print(f"pdflatex warning/error: {e.stdout[-500:]}")
            
        pdf_path = os.path.join(temp_dir, "resume.pdf")
        
        if not os.path.exists(pdf_path):
            raise RuntimeError("Failed to generate PDF. The LaTeX compilation likely encountered a fatal error.")
            
        with open(pdf_path, "rb") as pdf_file:
            pdf_bytes = pdf_file.read()
            
        return pdf_bytes


async def generate_cover_letter_latex(cover_letter_text: str, profile_text: str, custom_instructions: str = "") -> str:
    """
    Calls OpenAI to format a generated cover letter into the LaTeX template.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing. Cannot generate cover letter.")

    template_path = os.path.join(os.path.dirname(__file__), "..", "..", "cover_letter_template.txt")
    if not os.path.exists(template_path):
        raise FileNotFoundError("Could not find the cover letter LaTeX template file.")
        
    with open(template_path, "r", encoding="utf-8") as f:
        latex_template = f.read()

    system_prompt = """
You are an expert Cover Letter Generator.
Your task is to take the user's generated cover letter text and strictly map it into the EXACT provided LaTeX template.

CRITICAL RULES:
1. You MUST use the exact preamble, margins, and header layout defined in the provided LATEX TEMPLATE. DO NOT invent your own LaTeX structure.
2. The template contains uppercase placeholders (e.g. CANDIDATE_NAME, CANDIDATE_EMAIL, COMPANY_NAME_AND_ADDRESS, COVER_LETTER_BODY_PARAGRAPHS). You MUST replace these placeholders with the actual data parsed from the user's PROFILE TEXT and the COVER LETTER TEXT.
3. Put the target company name and address in the COMPANY_NAME_AND_ADDRESS block.
4. Ensure the LinkedIn URL is fully written out (e.g. linkedin.com/in/...).
5. ONLY return the final, complete LaTeX code. Do NOT wrap it in markdown block quotes.
6. Escape special LaTeX characters like %, &, $, _, #, {, } by prefixing with a backslash if they appear.
"""

    instructions_block = f"\n\nUSER'S CUSTOM INSTRUCTIONS FOR FORMATTING:\n{custom_instructions}" if custom_instructions else ""

    user_message = f"""
LATEX TEMPLATE:
{latex_template}

USER PROFILE TEXT (For Header extraction):
{profile_text}

COVER LETTER TEXT (For Body):
{cover_letter_text}{instructions_block}
"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
        )
        
        latex_code = response.choices[0].message.content.strip()
        if latex_code.startswith("```"):
            lines = latex_code.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            latex_code = "\n".join(lines).strip()
            
        return latex_code
    except Exception as e:
        print(f"Error calling OpenAI for LaTeX generation: {e}")
        raise

async def generate_cover_letter_pdf(cover_letter_text: str, profile_text: str = "", custom_instructions: str = "") -> bytes:
    """
    Generates the LaTeX code for a cover letter and compiles it to a PDF using pdflatex.
    """
    latex_code = await generate_cover_letter_latex(cover_letter_text, profile_text, custom_instructions)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        tex_path = os.path.join(temp_dir, "cover_letter.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_code)
            
        pdflatex_cmd = "pdflatex"
        miktex_path = os.path.expanduser(r"~\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe")
        if os.path.exists(miktex_path):
            pdflatex_cmd = miktex_path

        try:
            subprocess.run(
                [pdflatex_cmd, "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        except FileNotFoundError:
            raise RuntimeError(f"LaTeX compilation failed: '{pdflatex_cmd}' not found.")
        except subprocess.CalledProcessError as e:
            pass
            
        pdf_path = os.path.join(temp_dir, "cover_letter.pdf")
        
        if not os.path.exists(pdf_path):
            raise RuntimeError("Failed to generate PDF. The LaTeX compilation likely encountered a fatal error.")
            
        with open(pdf_path, "rb") as pdf_file:
            pdf_bytes = pdf_file.read()
            
        return pdf_bytes
