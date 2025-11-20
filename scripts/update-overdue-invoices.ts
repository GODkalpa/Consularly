/**
 * Update Overdue Invoices Script
 * 
 * This script checks for invoices that are past their due date
 * and updates their status to "overdue" if they are not already paid.
 * 
 * Run this script daily via a cron job or scheduled task.
 * 
 * Usage: npx tsx scripts/update-overdue-invoices.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
  initializeApp({
    credential: cert(serviceAccountPath)
  });
}

const db = getFirestore();

async function updateOverdueInvoices() {
  console.log('Starting overdue invoice check...');
  
  const now = Timestamp.now();
  const invoicesRef = db.collection('invoices');
  
  // Query for invoices that are not paid and have a due date in the past
  const snapshot = await invoicesRef
    .where('status', 'in', ['draft', 'sent', 'pending'])
    .where('dueDate', '<', now)
    .get();
  
  if (snapshot.empty) {
    console.log('No overdue invoices found.');
    return;
  }
  
  console.log(`Found ${snapshot.size} overdue invoice(s).`);
  
  const batch = db.batch();
  let updateCount = 0;
  
  for (const doc of snapshot.docs) {
    const invoice = doc.data();
    console.log(`Updating invoice ${invoice.invoiceNumber} to overdue status.`);
    
    batch.update(doc.ref, {
      status: 'overdue',
      updatedAt: now
    });
    
    // Create audit log entry
    const auditLogRef = db.collection('accounting_audit_log').doc();
    batch.set(auditLogRef, {
      entityType: 'invoice',
      entityId: doc.id,
      action: 'update',
      changes: {
        status: { old: invoice.status, new: 'overdue' }
      },
      userId: 'system',
      timestamp: now,
      metadata: {
        reason: 'Automated overdue status update',
        dueDate: invoice.dueDate
      }
    });
    
    updateCount++;
  }
  
  await batch.commit();
  console.log(`Successfully updated ${updateCount} invoice(s) to overdue status.`);
}

// Run the script
updateOverdueInvoices()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating overdue invoices:', error);
    process.exit(1);
  });
