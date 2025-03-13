export interface Theme {
    name: string;
    gradient: string;
    color: "slate" | "gray" | "zinc" | "neutral" | "stone" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose";
    startColor: string;
    endColor: string;
}

export const allThemes = {
    "firecrawl": {
        "name": "firecrawl",
        "gradient": "linear-gradient(135deg, #fdba74, #f97316)",
        "startColor": "#fdba74",
        "endColor": "#f97316",
        "color": "orange",
    },
    "ocean": {
        "name": "ocean",
        "gradient": "linear-gradient(135deg, #61a5c2, #1a2980)",
        "startColor": "#61a5c2",
        "endColor": "#1a2980",
        "color": "blue",
    },
    "forest": {
        name: "forest",
        gradient: "linear-gradient(135deg, #a8d8ea, #021c1e)",
        startColor: "#a8d8ea",
        endColor: "#021c1e",
        color: "teal",
    },
    
    "sunset": {
        "name": "sunset",
        "gradient": "linear-gradient(135deg, #ff7e5f, #feb47b)",
        "startColor": "#ff7e5f",
        "endColor": "#feb47b",
        "color": "orange",
    },
    "space": {
        "name": "space",
        "gradient": "linear-gradient(135deg, #000428, #004e92)",
        "startColor": "#000428",
        "endColor": "#004e92",
        "color": "indigo",
    },
    "sky": {
        "name": "sky",
        "gradient": "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
        "startColor": "#a1c4fd",
        "endColor": "#c2e9fb",
        "color": "sky",
    },
    "night": {
        "name": "night",
        "gradient": "linear-gradient(135deg, #000000, #434343)",
        "startColor": "#000000",
        "endColor": "#434343",
        "color": "gray",
    },
    "dawn": {
        "name": "dawn",
        "gradient": "linear-gradient(135deg, #ff9a9e, #fad0c4)",
        "startColor": "#ff9a9e",
        "endColor": "#fad0c4",
        "color": "pink",
    },
    "aurora": {
        "name": "aurora",
        "gradient": "linear-gradient(135deg, #00c6ff, #0072ff)",
        "startColor": "#00c6ff",
        "endColor": "#0072ff",
        "color": "cyan",
    },
    "meadow": {
        "name": "meadow",
        "gradient": "linear-gradient(135deg, #a8e063, #56ab2f)",
        "startColor": "#a8e063",
        "endColor": "#56ab2f",
        "color": "green",
    },
    "galaxy": {
        "name": "galaxy",
        "gradient": "linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)",
        "startColor": "#3a1c71",
        "endColor": "#ffaf7b",
        "color": "purple",
    }
    
}

