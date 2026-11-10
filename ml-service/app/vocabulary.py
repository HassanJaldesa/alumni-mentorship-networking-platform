"""Fixed answer lists for the onboarding questionnaire.

The order of each list sets the position of each value in the structured
(multi-hot) vector, so it must match frontend/lib/vocabulary.ts exactly.
tests/test_vocabulary.py checks this.
"""

INDUSTRIES = [
    "Software & IT",
    "Banking & Finance",
    "Fintech & Mobile Money",
    "Telecommunications",
    "Consulting",
    "Data & Analytics",
    "Cybersecurity",
    "Healthcare",
    "Energy & Utilities",
    "Education & Research",
]

SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "SQL",
    "Data Analysis",
    "Machine Learning",
    "Cloud Computing",
    "Cybersecurity",
    "Networking",
    "Web Development",
    "Mobile Development",
    "DevOps",
    "UI/UX Design",
    "Project Management",
    "Product Management",
    "Financial Analysis",
    "Accounting",
    "Business Strategy",
    "Public Speaking",
    "Leadership",
]

MENTORSHIP_INTERESTS = [
    "Career Guidance",
    "Technical Skills",
    "Internships & Job Search",
    "CV & Interview Preparation",
    "Entrepreneurship",
    "Graduate Studies",
    "Leadership Development",
    "Industry Insights",
    "Professional Networking",
    "Work-Life Balance",
]

AVAILABILITY = [
    "Weekday Mornings",
    "Weekday Evenings",
    "Weekends",
    "Flexible",
]

# 10 + 20 + 10 + 4 = 44 positions in the structured vector.
STRUCTURED_DIMENSION = (
    len(INDUSTRIES) + len(SKILLS) + len(MENTORSHIP_INTERESTS) + len(AVAILABILITY)
)