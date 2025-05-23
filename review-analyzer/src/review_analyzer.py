import os
from openai import OpenAI
from typing import Dict, List, Tuple
import math, json

class ReviewAnalyzer:
    def __init__(self):
        # Initialize OpenAI client
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    def _analyze_batch(self, reviews_batch: List[str]) -> Dict[str, List[str]]:
        """Analyze a single batch of reviews."""
        combined_reviews = "\n".join([review for review in reviews_batch if review.strip()])
        
        if not combined_reviews:
            return {"pros": [], "cons": []}
        
        prompt = f"""Analyze the following product reviews and extract the main pros and cons. 
        Format the response as a JSON object with two arrays: 'pros' and 'cons'.
        Each pro and con should be a clear, concise statement.
        Focus on the most frequently mentioned points and common themes.
        
        Reviews:
        {combined_reviews}
        
        Return ONLY a JSON object in this format:
        {{
            "pros": ["pro1", "pro2", ...],
            "cons": ["con1", "con2", ...]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that analyzes product reviews and extracts meaningful pros and cons."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            analysis = response.choices[0].message.content
            import json
            return json.loads(analysis)
            
        except Exception as e:
            print(f"Error analyzing review batch: {str(e)}")
            return {"pros": [], "cons": []}
    
    def _merge_analyses(self, analyses: List[Dict[str, List[str]]]) -> Dict[str, List[str]]:
        """Merge multiple analyses into a single analysis, removing duplicates."""
        all_pros = set()
        all_cons = set()
        
        for analysis in analyses:
            all_pros.update(analysis.get("pros", []))
            all_cons.update(analysis.get("cons", []))
        
        return {
            "pros": list(all_pros),
            "cons": list(all_cons)
        }
        
    def analyze_reviews(self, reviews: List[str]) -> Dict[str, List[str]]:
        """
        Analyze the scraped reviews using OpenAI to extract pros and cons.
        Processes reviews in batches to avoid token limit issues.
        
        Args:
            reviews: List of review texts
            
        Returns:
            Dictionary containing lists of pros and cons
        """
        if not reviews:
            return {"pros": [], "cons": []}
            
        # Process reviews in batches of 10
        BATCH_SIZE = 10
        num_batches = 4
        analyses = []
        
        for i in range(4):
            start_idx = i * BATCH_SIZE
            end_idx = min((i + 1) * BATCH_SIZE, len(reviews))
            batch = reviews[start_idx:end_idx]
            
            print(f"Processing batch {i+1}/{num_batches} ({len(batch)} reviews)")
            batch_analysis = self._analyze_batch(batch)
            analyses.append(batch_analysis)
        
        # Merge all analyses
        final_analysis = self._merge_analyses(analyses)
        
        # Get a final summary of the most important points
        try:
            summary_prompt = f"""Given these pros and cons from multiple batches of reviews, 
            identify the most important and frequently mentioned points.
            Return a JSON object with the top 5 pros and top 5 cons.
            
            All pros: {final_analysis['pros']}
            All cons: {final_analysis['cons']}
            
            Return ONLY a JSON object in this format:
            {{
                "pros": ["top5pro1", "top5pro2", ...],
                "cons": ["top5con1", "top5con2", ...]
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes product review analysis."},
                    {"role": "user", "content": summary_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            summary = json.loads(response.choices[0].message.content)
            return summary
            
        except Exception as e:
            print(f"Error creating final summary: {str(e)}")
            return final_analysis 