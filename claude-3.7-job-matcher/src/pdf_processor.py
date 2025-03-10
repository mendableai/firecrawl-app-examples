import io
import base64
import PyPDF2  # Import PyPDF2 for PDF text extraction

class PDFProcessor:
    @staticmethod
    def extract_text_from_pdf(pdf_file) -> str:
        """
        Process a PDF file uploaded through Streamlit
        
        Args:
            pdf_file: The PDF file uploaded through st.file_uploader
            
        Returns:
            str: The extracted text content from the PDF
        """
        try:
            # Get the filename if available
            filename = pdf_file.name if hasattr(pdf_file, 'name') else "uploaded PDF"
            
            # Read the PDF file
            pdf_bytes = pdf_file.read()
            
            # Create a PDF reader object
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            
            # Extract text from all pages
            text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
            
            # If no text was extracted, return a message
            if not text.strip():
                return f"""
RESUME: {filename}

NOTE: No text could be extracted from this PDF. The file might be scanned or image-based.
Please try using the Text Input option and paste your resume content directly.
                """
            
            # Return the extracted text
            return text
            
        except Exception as e:
            return f"Error processing PDF: {str(e)}" 