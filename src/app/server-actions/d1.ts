"use server";

import * as D1Actions from '@/lib/d1-actions';

export async function createResidence(data: any) {
  return D1Actions.createResidence(data);
}

export async function updateResidence(id: string, data: any) {
  return D1Actions.updateResidence(id, data);
}

export async function getWorkers() {
  return D1Actions.getWorkers();
}

export async function getResidences() {
  return D1Actions.getResidences();
}

export async function getOccupants(residenceId?: string) {
  return D1Actions.getOccupants(residenceId);
}

export async function getCompanies() {
  return D1Actions.getCompanies();
}

export async function getContracts() {
  return D1Actions.getContracts();
}

export async function getInvoices() {
  return D1Actions.getInvoices();
}

export async function getHistory() {
  return D1Actions.getHistory();
}

export async function getTransferRequests() {
  return D1Actions.getTransferRequests();
}

export async function getNotifications() {
  return D1Actions.getNotifications();
}

export async function updateWorker(id: string, data: any) {
  return D1Actions.updateWorker(id, data);
}

export async function createWorker(data: any) {
  return D1Actions.createWorker(data);
}

export async function deleteWorker(id: string) {
  return D1Actions.deleteWorker(id);
}

export async function createTransferRequest(tr: any) {
  return D1Actions.createTransferRequest(tr);
}

export async function updateTransferRequest(id: string, data: any) {
  return D1Actions.updateTransferRequest(id, data);
}

export async function checkInWorker(params: any) {
  return D1Actions.checkInWorker(params);
}

export async function checkOutWorker(params: any) {
  return D1Actions.checkOutWorker(params);
}

export async function getUser(id: string) {
  return D1Actions.getUser(id);
}

export async function updateUser(id: string, data: any) {
  return D1Actions.updateUser(id, data);
}

// Add more proxies as needed
