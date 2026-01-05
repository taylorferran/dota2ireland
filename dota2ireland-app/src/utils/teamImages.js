// Team image utilities for local storage
// This replaces Supabase storage with local GitHub-hosted images

/**
 * Get the local path for a team's image
 * @param {Object} team - Team object with id, name, and optional image_url
 * @returns {string|null} - Local image path or null if no image
 */
export function getTeamImagePath(team) {
  if (!team) return null;
  
  // If team has a local image reference, use it
  if (team.local_image) {
    return team.local_image;
  }
  
  // If team has image_url, check if it's already a local path
  if (team.image_url) {
    if (team.image_url.startsWith('/img/teams/')) {
      return team.image_url;
    }
    
    // If it's still a Supabase URL, try to map it
    // This is for backwards compatibility during migration
    if (team.image_url.includes('supabase')) {
      console.warn(`Team ${team.name} still has Supabase URL. Please migrate to local images.`);
      return null;
    }
  }
  
  return null;
}

/**
 * Save a team image locally (for form uploads)
 * This converts the file to base64 for now, but ideally you'd upload to GitHub
 * @param {File} file - Image file
 * @param {string} teamName - Team name for filename
 * @returns {Promise<string>} - Local path or URL
 */
export async function saveTeamImageLocally(file, teamName) {
  // For now, we'll return a data URL for preview
  // In production, you'd want to:
  // 1. Upload to GitHub via API, or
  // 2. Have admins manually add images to the repo
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Return sanitized filename that would be used
      const sanitizedName = teamName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      const extension = file.name.split('.').pop();
      const localPath = `/img/teams/${sanitizedName}.${extension}`;
      
      // For now, return data URL for preview
      // You'll need to manually save the file
      resolve({
        localPath,
        previewUrl: e.target.result,
        filename: `${sanitizedName}.${extension}`,
        message: 'Please manually save this image to public/img/teams/'
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get fallback initial for team without image
 * @param {string} teamName - Team name
 * @returns {string} - First letter of team name
 */
export function getTeamInitial(teamName) {
  return teamName ? teamName.charAt(0).toUpperCase() : '?';
}

/**
 * Sanitize team name for filename
 * @param {string} name - Team name
 * @returns {string} - Sanitized filename
 */
export function sanitizeTeamName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

