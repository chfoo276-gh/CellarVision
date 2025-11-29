import { exportData, importData } from './storageService';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const DB_FILE_NAME = "cellarvision_db.json";

// Type definition for global window object
declare global {
  interface Window {
    gapi: any;
  }
}

// Robust script loader
const loadGapiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.body.appendChild(script);
  });
};

export const initGapiClient = async () => {
  await loadGapiScript();

  return new Promise<void>((resolve, reject) => {
    const gapi = window.gapi;
    if (!gapi) {
      reject(new Error("Google API script loaded but window.gapi is undefined"));
      return;
    }

    const initClient = async () => {
       try {
        // Only load the client, DO NOT call gapi.auth2.init or similar legacy auth methods.
        // We only need discovery docs to use the Drive API endpoints.
        await gapi.client.init({
          discoveryDocs: DISCOVERY_DOCS,
        });
        console.log("GAPI Client Initialized Successfully");
        resolve();
      } catch (e) {
        console.error("GAPI Init Error", e);
        reject(e);
      }
    };

    // If client is already loaded, just init
    if (gapi.client) {
        initClient();
        return;
    }

    // Load the client library
    gapi.load('client', {
      callback: () => {
        // Poll for client existence if not immediately available
        let attempts = 0;
        const checkClient = () => {
            if (gapi.client) {
                initClient();
            } else {
                attempts++;
                if (attempts > 50) { // Wait up to ~5 seconds
                     reject(new Error("GAPI 'client' library failed to load after polling"));
                } else {
                    setTimeout(checkClient, 100);
                }
            }
        };
        checkClient();
      },
      onerror: () => reject(new Error("Failed to load gapi.client"))
    });
  });
};

// Search for existing DB file
const findDbFile = async (): Promise<string | null> => {
  try {
    const gapi = window.gapi;
    if (!gapi || !gapi.client || !gapi.client.drive) {
        console.warn("GAPI Drive client not ready during file search");
        return null;
    }

    const response = await gapi.client.drive.files.list({
      q: `name = '${DB_FILE_NAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }
    return null;
  } catch (err) {
    console.error("Error finding DB file", err);
    return null;
  }
};

// Download content from Drive and save to LocalStorage
export const syncFromCloud = async (accessToken: string): Promise<boolean> => {
  try {
    const gapi = window.gapi;
    // Ensure GAPI is initialized if not already
    if (!gapi || !gapi.client) await initGapiClient();
    
    // Ensure token is set for GAPI requests
    if (gapi && gapi.client) {
        gapi.client.setToken({ access_token: accessToken });
    } else {
        throw new Error("GAPI client not available for sync");
    }

    const fileId = await findDbFile();
    if (!fileId) return false; // No cloud data found

    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    const cloudData = response.result; // This is the JSON object
    if (cloudData) {
      importData(JSON.stringify(cloudData));
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error syncing from cloud", err);
    return false;
  }
};

// Upload current LocalStorage to Drive
export const syncToCloud = async (): Promise<void> => {
  try {
    const gapi = window.gapi;
    // Safety check
    if (!gapi || !gapi.client) return;

    const data = exportData(); // Get all local data as JSON string
    
    // Check if we have a token, otherwise we can't sync
    const tokenObj = gapi.client.getToken();
    if (!tokenObj || !tokenObj.access_token) return;

    const fileId = await findDbFile();

    const fileContent = new Blob([data], { type: 'application/json' });
    const metadata = {
      name: DB_FILE_NAME,
      mimeType: 'application/json',
    };

    const accessToken = tokenObj.access_token;

    if (fileId) {
      // Update existing file
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: constructMultipartBody(metadata, fileContent)
      });
    } else {
      // Create new file
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: constructMultipartBody(metadata, fileContent)
      });
    }
    console.log("Synced to cloud successfully");
  } catch (err) {
    console.error("Error syncing to cloud", err);
  }
};

// Helper to build the multipart body for Drive API
const constructMultipartBody = (metadata: any, fileContent: Blob) => {
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', fileContent);
  return formData;
};