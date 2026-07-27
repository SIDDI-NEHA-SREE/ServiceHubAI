import json
import logging
from typing import Dict, Any
from google import genai
from google.genai import types

from app.core.config import settings
from app.models.models import TicketPriority

logger = logging.getLogger(__name__)


def classify_ticket_text(title: str, description: str) -> Dict[str, Any]:
    """
    Analyzes ticket title & description using Google Gemini API to detect:
    category, priority, suggested department, confidence score, and reasoning.
    """
    api_key = settings.GEMINI_API_KEY
    combined_text = f"Title: {title}\nDescription: {description}".lower()

    # Try Gemini API if key is present
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""
You are an expert ITIL Enterprise Service Desk AI Classifier.
Analyze the following support ticket and respond STRICTLY in JSON format with no markdown wrappers:

Ticket Content:
{title}
{description}

JSON Schema:
{{
  "suggested_category": "<IT Support & Network | Hardware Provisioning | Payroll & HR | Facilities & Workplace | General>",
  "suggested_priority": "<LOW | MEDIUM | HIGH | URGENT>",
  "suggested_department": "<IT Support & Infrastructure | Human Resources (HR) | Finance & Billing | Facilities & Workplace>",
  "confidence_score": <float between 0.5 and 0.99>,
  "reasoning": "<short sentence explanation>"
}}
"""
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )

            result = json.loads(response.text)
            return {
                "suggested_category": result.get("suggested_category", "IT Support & Network"),
                "suggested_priority": TicketPriority(result.get("suggested_priority", "MEDIUM")),
                "suggested_department": result.get("suggested_department", "IT Support & Infrastructure"),
                "confidence_score": float(result.get("confidence_score", 0.92)),
                "reasoning": result.get("reasoning", "Classified using Google Gemini 1.5 Flash AI model.")
            }
        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to rule engine: {e}")

    # Fallback Rule-Based AI Engine
    priority = TicketPriority.MEDIUM
    category = "IT Support & Network"
    department = "IT Support & Infrastructure"
    confidence = 0.88
    reasoning = "Classified via ServiceHub Heuristic AI Engine."

    # Urgent keywords
    if any(k in combined_text for k in ["outage", "down", "critical", "urgent", "security breach", "ransomware", "server crash"]):
        priority = TicketPriority.URGENT
        confidence = 0.96
        reasoning = "High severity keywords (outage, server crash, security) detected."
    elif any(k in combined_text for k in ["vpn", "disconnect", "cannot access", "slow", "error", "bug"]):
        priority = TicketPriority.HIGH
        confidence = 0.94
        reasoning = "Network connection and access issues detected."
    elif any(k in combined_text for k in ["macbook", "laptop", "monitor", "keyboard", "mouse", "hardware"]):
        category = "Hardware Provisioning"
        priority = TicketPriority.MEDIUM
        reasoning = "Hardware procurement request detected."
    elif any(k in combined_text for k in ["payroll", "salary", "direct deposit", "bank account", "tax", "w2", "leave"]):
        category = "Payroll & HR"
        department = "Human Resources (HR)"
        priority = TicketPriority.LOW if "inquiry" in combined_text else TicketPriority.MEDIUM
        reasoning = "HR and payroll subject matter detected."
    elif any(k in combined_text for k in ["ac", "air conditioning", "desk", "chair", "badge", "office", "door"]):
        category = "Facilities & Workplace"
        department = "Facilities & Workplace"
        priority = TicketPriority.LOW
        reasoning = "Office facilities request detected."

    return {
        "suggested_category": category,
        "suggested_priority": priority,
        "suggested_department": department,
        "confidence_score": confidence,
        "reasoning": reasoning
    }
