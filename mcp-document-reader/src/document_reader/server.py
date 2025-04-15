from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.prompts import base
from markitdown import MarkItDown
import os

# Initialize the FastMCP server
mcp = FastMCP("DocumentReader", dependencies=["markitdown[all]"])
md = MarkItDown()


# === Tools ===
@mcp.tool()
def read_pdf(file_path: str) -> str:
    """Read a PDF file and return the text content.

    Args:
        file_path: Path to the PDF file to read
    """
    try:
        # Expand the tilde (if part of the path) to the home directory path
        expanded_path = os.path.expanduser(file_path)

        # Use markitdown to convert the PDF to text
        return md.convert(expanded_path).text_content
    except Exception as e:
        # Return error message that the LLM can understand
        return f"Error reading PDF: {str(e)}"


@mcp.tool()
def read_docx(file_path: str) -> str:
    """Read a DOCX file and return the text content.

    Args:
        file_path: Path to the Word document to read
    """
    try:
        expanded_path = os.path.expanduser(file_path)

        # Use markitdown to convert the DOCX to text
        return md.convert(expanded_path).text_content
    except Exception as e:
        return f"Error reading DOCX: {str(e)}"


# === Resources ===
@mcp.resource("file://document/pdf-example")
def provide_example_pdf():
    """Provide the content of an example PDF document.

    This resource makes a sample PDF available to the model without requiring
    the user to specify a path.
    """
    try:
        # Use an absolute path with the file:// schema
        pdf_path = "file:///Users/bexgboost/Downloads/test.pdf"
        # Convert the PDF to text using markitdown
        return md.convert(pdf_path).text_content
    except Exception as e:
        return f"Error providing example PDF: {str(e)}"


@mcp.resource("file://document/recent/{filename}")
def provide_recent_document(filename: str):
    """Provide access to a recently used document.

    This resource shows how to use path parameters to provide dynamic resources.
    """
    try:
        # Construct the path to the recent documents folder
        recent_docs_folder = os.path.expanduser("~/Documents/Recent")
        file_path = os.path.join(recent_docs_folder, filename)

        # Validate the file exists
        if not os.path.exists(file_path):
            return f"File not found: {filename}"

        # Convert to text using markitdown
        return md.convert(file_path).text_content
    except Exception as e:
        return f"Error accessing document: {str(e)}"


# === Prompts ===
@mcp.prompt()
def debug_pdf_path(error: str) -> list[base.Message]:
    """Debug prompt for PDF issues.

    This prompt helps diagnose issues when a PDF file cannot be read.

    Args:
        error: The error message encountered
    """
    return [
        base.Message(
            role="user",
            content=[
                base.TextContent(
                    text=f"I'm trying to read a PDF file but encountered this error: {error}. "
                    f"How can I resolve this issue? Please provide step-by-step troubleshooting advice."
                )
            ],
        )
    ]


def main():
    mcp.run()


if __name__ == "__main__":
    main()
