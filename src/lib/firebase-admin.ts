import { getApps, initializeApp, cert, applicationDefault, App, getApp, deleteApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'

let app: App | undefined

function loadServiceAccountFromEnv(): any | null {
  try {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT
    if (json) {
      return JSON.parse(json)
    }

    // Support both *_ADMIN_* and non-admin variable names for convenience
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY

    if (projectId && clientEmail && privateKey) {
      // Handle escaped newlines from env
      privateKey = privateKey.replace(/\\n/g, '\n')
      return { project_id: projectId, client_email: clientEmail, private_key: privateKey }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[firebase-admin] Failed parsing FIREBASE_SERVICE_ACCOUNT JSON:', e)
  }
  return null
}

function loadServiceAccountFromFile(): any | null {
  try {
    // Prefer GOOGLE_APPLICATION_CREDENTIALS if present
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (credsPath && fs.existsSync(credsPath)) {
      return JSON.parse(fs.readFileSync(credsPath, 'utf8'))
    }

    // Fallback to common local paths for dev
    const candidates = [
      path.join(process.cwd(), 'scripts', 'service-account-key.json'),
      path.join(process.cwd(), 'service-account-key.json'),
      path.join(process.cwd(), 'serviceAccountKey.json'),
      path.join(process.cwd(), 'serviceAccount.json'),
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'))
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[firebase-admin] Unable to read service account file:', e)
  }
  return null
}

export async function ensureFirebaseAdmin(): Promise<void> {
  // Check if app already exists (handles hot reload in development)
  const existingApps = getApps()
  if (existingApps.length > 0) {
    app = existingApps[0]
    return
  }
  
  if (app) {
    return
  }

  const saFromEnv = loadServiceAccountFromEnv()
  const saFromFile = saFromEnv ? null : loadServiceAccountFromFile()

  if (saFromEnv || saFromFile) {
    const svc = saFromEnv || saFromFile
    // eslint-disable-next-line no-console
    console.info('[firebase-admin] Initializing with service account (env/file). Project:', svc.project_id)
    app = initializeApp({
      credential: cert({
        projectId: svc.project_id,
        clientEmail: svc.client_email,
        privateKey: svc.private_key,
      }),
    })
  } else {
    // As a last resort, attempt application default credentials (GCP envs).
    // Provide projectId explicitly to avoid metadata server lookup locally.
    const fallbackProjectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT
    // eslint-disable-next-line no-console
    console.info('[firebase-admin] Using applicationDefault credentials. Project:', fallbackProjectId || '(unknown)')
    app = initializeApp({
      credential: applicationDefault(),
      projectId: fallbackProjectId,
    } as any)
  }
}

// Initialize immediately on first import in server runtime
if (typeof window === 'undefined') {
  try { ensureFirebaseAdmin() } catch (e) { /* no-op */ }
}

export const adminAuth = () => getAuth()
export const adminDb = () => getFirestore()
export { FieldValue, Timestamp }
