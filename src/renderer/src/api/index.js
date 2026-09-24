export function videoPage({ page = 1, pageSize = 1, name = '' }) {
  return window.electron.ipcRenderer.invoke('video/page', { page, pageSize, name })
}

export function findVideo(id) {
  return window.electron.ipcRenderer.invoke('video/find', id)
}

export function removeVideo(id) {
  return window.electron.ipcRenderer.invoke('video/remove', id)
}

export function saveVideo(video) {
  return window.electron.ipcRenderer.invoke('video/save', video)
}

export function makeVideo(id) {
  return window.electron.ipcRenderer.invoke('video/make', id)
}

export function exportVideo(id, outputPath) {
  return window.electron.ipcRenderer.invoke('video/export', id, outputPath)
}

export function modifyVideo(video) {
  return window.electron.ipcRenderer.invoke('video/modify', video)
}

export function countVideo(name = '') {
  return window.electron.ipcRenderer.invoke('video/count', name)
}

export function modelPage({ page = 1, pageSize = 10, name = '', groupId = undefined }) {
  return window.electron.ipcRenderer.invoke('model/page', { page, pageSize, name, groupId })
}

export function findModel(id) {
  return window.electron.ipcRenderer.invoke('model/find', id)
}

export function addModel({ name, videoPath, groupId = null }) {
  return window.electron.ipcRenderer.invoke('model/addModel', name, videoPath, groupId)
}

export function countModel(param = '') {
  return window.electron.ipcRenderer.invoke('model/count', param)
}

export function removeModel(id) {
  return window.electron.ipcRenderer.invoke('model/remove', id)
}

export function updateModelGroup(modelId, groupId) {
  return window.electron.ipcRenderer.invoke('model/updateGroup', modelId, groupId)
}

export function batchUpdateModelGroup(modelIds, groupId) {
  return window.electron.ipcRenderer.invoke('model/batchUpdateGroup', modelIds, groupId)
}

export function listModelGroups() {
  return window.electron.ipcRenderer.invoke('model_group/list')
}

export function addModelGroup(name) {
  return window.electron.ipcRenderer.invoke('model_group/add', name)
}

export function renameModelGroup(id, name) {
  return window.electron.ipcRenderer.invoke('model_group/rename', id, name)
}

export function removeModelGroup(id) {
  return window.electron.ipcRenderer.invoke('model_group/remove', id)
}

export function getContext(key) {
  return window.electron.ipcRenderer.invoke('context/get', key)
}

export function saveContext(key, val) {
  return window.electron.ipcRenderer.invoke('context/save', key, val)
}

export function audition(voiceId, text) {
  return window.electron.ipcRenderer.invoke('voice/audition', voiceId, text)
}
