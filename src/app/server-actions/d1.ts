"use server";

import * as D1Actions from '@/lib/d1-actions';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Helper to get env for server actions
function getEnv() {
  try {
    const { env } = getRequestContext();
    return env;
  } catch (e) {
    console.error('Failed to get request context in server action:', e);
    return null;
  }
}

export async function createResidence(data: any) {
  return D1Actions.createResidence(getEnv(), data);
}

export async function updateResidence(id: string, data: any) {
  return D1Actions.updateResidence(getEnv(), id, data);
}

export async function getWorkers() {
  return D1Actions.getWorkers(getEnv());
}

export async function getResidences() {
  return D1Actions.getResidences(getEnv());
}

export async function getOccupants(residenceId?: string) {
  return D1Actions.getOccupants(getEnv(), residenceId);
}

export async function getCompanies() {
  return D1Actions.getCompanies(getEnv());
}

export async function getContracts() {
  return D1Actions.getContracts(getEnv());
}

export async function getInvoices() {
  return D1Actions.getInvoices(getEnv());
}

export async function getHistory() {
  return D1Actions.getHistory(getEnv());
}

export async function getTransferRequests() {
  return D1Actions.getTransferRequests(getEnv());
}

export async function getNotifications() {
  return D1Actions.getNotifications(getEnv());
}

export async function updateWorker(id: string, data: any) {
  return D1Actions.updateWorker(getEnv(), id, data);
}

export async function createWorker(data: any) {
  return D1Actions.createWorker(getEnv(), data);
}

export async function deleteWorker(id: string) {
  return D1Actions.deleteWorker(getEnv(), id);
}

export async function createTransferRequest(tr: any) {
  return D1Actions.createTransferRequest(getEnv(), tr);
}

export async function updateTransferRequest(id: string, data: any) {
  return D1Actions.updateTransferRequest(getEnv(), id, data);
}

export async function checkInWorker(params: any) {
  return D1Actions.checkInWorker(getEnv(), params);
}

export async function checkOutWorker(params: any) {
  return D1Actions.checkOutWorker(getEnv(), params);
}

export async function getUser(id: string) {
  return D1Actions.getUser(getEnv(), id);
}

export async function updateUser(id: string, data: any) {
  return D1Actions.updateUser(getEnv(), id, data);
}

// Add more proxies as needed
