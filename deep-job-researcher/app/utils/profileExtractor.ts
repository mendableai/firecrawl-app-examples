/**
 * Profile extractor utility - stub implementation
 */

export function extractProfileData(html: string): any {
  console.log("extractProfileData called with HTML length:", html.length);
  // Return empty data structure
  return {
    name: "",
    title: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    contact: {
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      website: "",
    },
  };
}
