/**
 * Resume parser utility - stub implementation
 */

export function parseResume(text: string): any {
  console.log("parseResume called with text length:", text.length);
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
