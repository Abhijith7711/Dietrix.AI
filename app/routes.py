from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.rag_pipeline import load_rag_chain

router = APIRouter()

# Lazy load the RAG chain
rag_chain = None

def get_rag_chain():
    global rag_chain
    if rag_chain is None:
        try:
            rag_chain = load_rag_chain()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load RAG chain: {str(e)}")
    return rag_chain

class GetRecommendationsRequest(BaseModel):
    health_conditions: str
    allergies: str
    is_vegetarian: bool = False

@router.post("/get_recommendations")
def get_recommendations(data: GetRecommendationsRequest):
    """Comprehensive diet recommendations based on health conditions, allergies, and personal factors"""
    try:
        chain = get_rag_chain()
        
        # Build a comprehensive prompt
        prompt_parts = []
        
        if data.health_conditions.strip():
            prompt_parts.append(f"health conditions: {data.health_conditions}")
        
        if data.allergies.strip():
            prompt_parts.append(f"allergies: {data.allergies}")
        
        if data.is_vegetarian:
            prompt_parts.append("vegetarian diet")
        
        context = ", ".join(prompt_parts) if prompt_parts else "general health"
        
        prompt = (
            f"Create a personalized diet recommendation for someone with {context}. "
            f"Please structure your response EXACTLY in the following format:\n\n"
            f"DIETARY RECOMMENDATIONS:\n"
            f"[Provide a brief overview of the diet plan]\n\n"
            f"MEAL SUGGESTIONS:\n"
            f"Breakfast: [specific breakfast meal suggestions like 'Oatmeal with berries and nuts' or 'Greek yogurt with honey and granola']\n"
            f"Lunch: [specific lunch meal suggestions like 'Quinoa salad with vegetables' or 'Lentil soup with whole grain bread']\n"
            f"Dinner: [specific dinner meal suggestions like 'Grilled salmon with steamed vegetables' or 'Chicken stir-fry with brown rice']\n"
            f"Snacks: [specific snack suggestions like 'Apple with almond butter' or 'Carrot sticks with hummus']\n\n"
            f"FOODS TO AVOID:\n"
            f"- [list specific foods]\n\n"
            f"RECOMMENDED FOODS:\n"
            f"- [list specific foods]\n\n"
            f"HEALTH ADVICE:\n"
            f"[Provide specific advice for overcoming the health condition and improving overall health based on nutritional research. Use proper markdown formatting with - for bullet points. Include lifestyle changes, monitoring tips, and recovery strategies.]\n\n"
            f"IMPORTANT: Make sure to include specific meal suggestions for breakfast, lunch, dinner, and snacks. "
            f"Each meal should have concrete food suggestions, not just general guidelines. "
            f"Provide actual meal combinations that people can easily prepare. "
            f"For the HEALTH ADVICE section, use proper markdown formatting with - for bullet points and focus on evidence-based recommendations for managing and improving the specific health condition mentioned."
        )

        result = chain.invoke({"query": prompt})
        response_text = result["result"]
        
        # Parse the response into structured sections
        sections = {
            "dietary_recommendations": "",
            "meal_suggestions": {
                "breakfast": "",
                "lunch": "",
                "dinner": "",
                "snacks": ""
            },
            "foods_to_avoid": [],
            "recommended_foods": [],
            "health_advice": ""
        }
        
        # Parse the response text
        lines = response_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect sections
            if "DIETARY RECOMMENDATIONS:" in line.upper():
                current_section = "dietary_recommendations"
                continue
            elif "MEAL SUGGESTIONS:" in line.upper():
                current_section = "meal_suggestions"
                continue
            elif "FOODS TO AVOID:" in line.upper():
                current_section = "foods_to_avoid"
                continue
            elif "RECOMMENDED FOODS:" in line.upper():
                current_section = "recommended_foods"
                continue
            elif "HEALTH ADVICE:" in line.upper():
                current_section = "health_advice"
                continue
            
            # Process content based on current section
            if current_section == "dietary_recommendations":
                if line and not line.startswith("DIETARY RECOMMENDATIONS:"):
                    sections["dietary_recommendations"] += line + " "
            
            elif current_section == "meal_suggestions":
                if line.lower().startswith("breakfast:"):
                    sections["meal_suggestions"]["breakfast"] = line.replace("Breakfast:", "").strip()
                elif line.lower().startswith("lunch:"):
                    sections["meal_suggestions"]["lunch"] = line.replace("Lunch:", "").strip()
                elif line.lower().startswith("dinner:"):
                    sections["meal_suggestions"]["dinner"] = line.replace("Dinner:", "").strip()
                elif line.lower().startswith("snacks:"):
                    sections["meal_suggestions"]["snacks"] = line.replace("Snacks:", "").strip()
                # Handle multi-line meal suggestions
                elif current_section == "meal_suggestions" and line and not line.startswith("MEAL SUGGESTIONS:"):
                    # If we're in meal suggestions but haven't found a specific meal yet, 
                    # this might be a continuation of the previous meal
                    if not sections["meal_suggestions"]["breakfast"]:
                        sections["meal_suggestions"]["breakfast"] = line.strip()
                    elif not sections["meal_suggestions"]["lunch"]:
                        sections["meal_suggestions"]["lunch"] = line.strip()
                    elif not sections["meal_suggestions"]["dinner"]:
                        sections["meal_suggestions"]["dinner"] = line.strip()
                    elif not sections["meal_suggestions"]["snacks"]:
                        sections["meal_suggestions"]["snacks"] = line.strip()
            
            elif current_section == "foods_to_avoid":
                if line.startswith("-") or line.startswith("•") or line.startswith("*"):
                    food_item = line[1:].strip()
                    if food_item:
                        sections["foods_to_avoid"].append(food_item)
            
            elif current_section == "recommended_foods":
                if line.startswith("-") or line.startswith("•") or line.startswith("*"):
                    food_item = line[1:].strip()
                    if food_item:
                        sections["recommended_foods"].append(food_item)
            
            elif current_section == "health_advice":
                if line and not line.startswith("HEALTH ADVICE:"):
                    if sections["health_advice"]:
                        sections["health_advice"] += " " + line.strip()
                    else:
                        sections["health_advice"] = line.strip()
        
        # Clean up the dietary recommendations
        sections["dietary_recommendations"] = sections["dietary_recommendations"].strip()
        
        # Clean up health advice - convert * to proper markdown
        if sections["health_advice"]:
            # Replace * with - for proper markdown bullet points
            sections["health_advice"] = sections["health_advice"].replace(" * ", "\n- ").replace("* ", "- ")
            # Ensure proper spacing
            sections["health_advice"] = sections["health_advice"].replace("\n-", "\n- ")
        
        # If meal suggestions are missing, generate them from recommended foods
        if not any(sections["meal_suggestions"].values()):
            # Generate basic meal suggestions from recommended foods
            if sections["recommended_foods"]:
                breakfast_items = [food for food in sections["recommended_foods"] if any(word in food.lower() for word in ['oatmeal', 'eggs', 'yogurt', 'berries', 'nuts', 'seeds', 'bread', 'milk'])]
                lunch_items = [food for food in sections["recommended_foods"] if any(word in food.lower() for word in ['salad', 'vegetables', 'rice', 'quinoa', 'beans', 'soup'])]
                dinner_items = [food for food in sections["recommended_foods"] if any(word in food.lower() for word in ['vegetables', 'rice', 'quinoa', 'beans', 'fish', 'chicken'])]
                snack_items = [food for food in sections["recommended_foods"] if any(word in food.lower() for word in ['nuts', 'seeds', 'berries', 'fruit'])]
                
                if breakfast_items:
                    sections["meal_suggestions"]["breakfast"] = f"Try: {', '.join(breakfast_items[:3])}"
                if lunch_items:
                    sections["meal_suggestions"]["lunch"] = f"Try: {', '.join(lunch_items[:3])}"
                if dinner_items:
                    sections["meal_suggestions"]["dinner"] = f"Try: {', '.join(dinner_items[:3])}"
                if snack_items:
                    sections["meal_suggestions"]["snacks"] = f"Try: {', '.join(snack_items[:3])}"
        
        # If parsing didn't work well, fall back to simple extraction
        if not sections["foods_to_avoid"] and not sections["recommended_foods"]:
            # Simple keyword-based extraction
            for line in lines:
                line_lower = line.lower().strip()
                if any(keyword in line_lower for keyword in ['avoid', 'not eat', 'stay away', 'eliminate', 'limit']):
                    if line.startswith("-") or line.startswith("•") or line.startswith("*"):
                        food_item = line[1:].strip()
                        if food_item and len(food_item) > 3:
                            sections["foods_to_avoid"].append(food_item)
                elif any(keyword in line_lower for keyword in ['recommend', 'include', 'eat', 'consume', 'add', 'good']):
                    if line.startswith("-") or line.startswith("•") or line.startswith("*"):
                        food_item = line[1:].strip()
                        if food_item and len(food_item) > 3:
                            sections["recommended_foods"].append(food_item)
        
        return {
            "dietary_recommendations": sections["dietary_recommendations"],
            "meal_suggestions": sections["meal_suggestions"],
            "foods_to_avoid": sections["foods_to_avoid"][:10],  # Limit to 10 items
            "recommended_foods": sections["recommended_foods"][:10],  # Limit to 10 items
            "health_advice": sections["health_advice"],
            "full_response": response_text  # Keep the full response for reference
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendation: {str(e)}")
