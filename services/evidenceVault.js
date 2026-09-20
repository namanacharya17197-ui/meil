/**
 * MEIL ESG Connect - Evidence Vault & Storage Service
 * Handles SHA-256 cryptographic integrity verification, metadata tracking,
 * and Supabase Storage bucket integration with local disk fallback.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure local uploads directory exists for fallback
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create uploads directory:', e.message);
  }
}

/**
 * Computes SHA-256 hash of a file buffer or string
 */
function computeSHA256(bufferOrString) {
  const hash = crypto.createHash('sha256');
  hash.update(bufferOrString);
  return hash.digest('hex');
}

/**
 * Validates whether a file buffer matches an expected SHA-256 hash
 */
function verifyFileIntegrity(buffer, expectedHash) {
  const actualHash = computeSHA256(buffer);
  return {
    valid: actualHash.toLowerCase() === expectedHash.toLowerCase(),
    actualHash,
    expectedHash
  };
}

/**
 * Store evidence file (Supabase storage or local disk fallback)
 */
async function storeEvidence({
  supabaseClient,
  fileName,
  fileBuffer,
  mimeType = 'application/pdf',
  attachedBy = 'Site Engineer',
  authorRole = 'Project Data Entry User',
  principleRef = 'P6-EI-01'
}) {
  const sha256 = computeSHA256(fileBuffer);
  const sizeKb = Number((fileBuffer.length / 1024).toFixed(2));
  const storagePath = `evidence/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  let uploadedToCloud = false;

  // Try Supabase Storage if client is provided and online
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.storage
        .from('esg-evidence-vault')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });
      if (!error) {
        uploadedToCloud = true;
      } else {
        console.warn('Supabase storage upload returned error, using local fallback:', error.message);
      }
    } catch (err) {
      console.warn('Cloud storage exception, falling back to local disk:', err.message);
    }
  }

  // Local disk backup
  try {
    const localFilePath = path.join(UPLOADS_DIR, path.basename(storagePath));
    fs.writeFileSync(localFilePath, fileBuffer);
  } catch (fsErr) {
    console.warn('Could not save to local filesystem:', fsErr.message);
  }

  const evidenceRecord = {
    id: `ev-${Date.now()}`,
    file_name: fileName,
    file_size_kb: sizeKb,
    mime_type: mimeType,
    storage_path: storagePath,
    sha256_hash: sha256,
    attached_by: attachedBy,
    author_role: authorRole,
    principle_ref: principleRef,
    verification_status: 'Verified',
    uploaded_to_cloud: uploadedToCloud,
    created_at: new Date().toISOString()
  };

  return evidenceRecord;
}

module.exports = {
  computeSHA256,
  verifyFileIntegrity,
  storeEvidence
};
