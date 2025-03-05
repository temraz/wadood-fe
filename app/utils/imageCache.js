import * as FileSystem from 'expo-file-system';

const imageCache = {};

export const getCachedImage = async (uri) => {
  if (!uri) return null;

  // Check if image is already cached
  if (imageCache[uri]) {
    return imageCache[uri];
  }

  try {
    // Create a unique filename for the cached image
    const filename = uri.split('/').pop();
    const path = `${FileSystem.cacheDirectory}${filename}`;

    // Check if file exists in cache
    const fileInfo = await FileSystem.getInfoAsync(path);
    
    if (fileInfo.exists) {
      imageCache[uri] = path;
      return path;
    }

    // Download and cache the image
    const download = await FileSystem.downloadAsync(uri, path);
    
    if (download.status !== 200) {
      throw new Error('Image download failed');
    }

    imageCache[uri] = path;
    return path;

  } catch (error) {
    console.log('Image caching error:', error);
    return uri; // Return original URI if caching fails
  }
};

// Add cleanup function
export const clearImageCache = async () => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    await FileSystem.deleteAsync(cacheDir, { idempotent: true });
    Object.keys(imageCache).forEach(key => delete imageCache[key]);
  } catch (error) {
    console.log('Cache cleanup error:', error);
  }
}; 