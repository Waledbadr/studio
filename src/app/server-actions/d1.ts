"use server";

import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

// Helper to get env for server actions
async function getEnv() {
  try {
    return (await getCloudflareEnvRecord()) ?? null;
  } catch (e) {
    console.error('Failed to get request context in server action:', e);
    return null;
  }
}

export async function createResidence(data: any) {
  return D1Actions.createResidence(await getEnv(), data);
}

export async function updateResidence(id: string, data: any) {
  return D1Actions.updateResidence(await getEnv(), id, data);
}

export async function getWorkers() {
  return D1Actions.getWorkers(await getEnv());
}

export async function getResidences() {
  return D1Actions.getResidences(await getEnv());
}

export async function getOccupants(residenceId?: string) {
  return D1Actions.getOccupants(await getEnv(), residenceId);
}

export async function getCompanies() {
  return D1Actions.getCompanies(await getEnv());
}

export async function getContracts() {
  return D1Actions.getContracts(await getEnv());
}

export async function getInvoices() {
  return D1Actions.getInvoices(await getEnv());
}

export async function getHistory() {
  return D1Actions.getHistory(await getEnv());
}

export async function getTransferRequests() {
  return D1Actions.getTransferRequests(await getEnv());
}

export async function getNotifications() {
  return D1Actions.getNotifications(await getEnv());
}

export async function updateWorker(id: string, data: any) {
  return D1Actions.updateWorker(await getEnv(), id, data);
}

export async function createWorker(data: any) {
  return D1Actions.createWorker(await getEnv(), data);
}

export async function deleteWorker(id: string) {
  return D1Actions.deleteWorker(await getEnv(), id);
}

export async function createTransferRequest(tr: any) {
  return D1Actions.createTransferRequest(await getEnv(), tr);
}

export async function updateTransferRequest(id: string, data: any) {
  return D1Actions.updateTransferRequest(await getEnv(), id, data);
}

export async function checkInWorker(params: any) {
  return D1Actions.checkInWorker(await getEnv(), params);
}

export async function checkOutWorker(params: any) {
  return D1Actions.checkOutWorker(await getEnv(), params);
}

export async function getUser(id: string) {
  return D1Actions.getUser(await getEnv(), id);
}

export async function updateUser(id: string, data: any) {
  return D1Actions.updateUser(await getEnv(), id, data);
}

// Add more proxies as needed
