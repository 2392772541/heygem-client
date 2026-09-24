import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash'
import {
  insert,
  selectPage,
  count,
  selectByID,
  remove as deleteModel,
  updateGroup,
  batchUpdateGroup
} from '../dao/f2f-model.js'
import * as groupDao from '../dao/model-group.js'
import { train as trainVoice } from './voice.js'
import { assetPath } from '../config/config.js'
import log from '../logger.js'
import { extractAudio, toH264 } from '../util/ffmpeg.js'
const MODEL_NAME = 'model'

/**
 * 新增模特
 * @param {string} modelName 模特名称
 * @param {string} videoPath 模特视频路径
 * @param {number|null} groupId 分组ID
 * @returns
 */
async function addModel(modelName, videoPath, groupId = null) {
  if (!fs.existsSync(assetPath.model)) {
    fs.mkdirSync(assetPath.model, {
      recursive: true
    })
  }
  // copy video to model video path
  const extname = path.extname(videoPath)
  const modelFileName = dayjs().format('YYYYMMDDHHmmssSSS') + extname
  const modelPath = path.join(assetPath.model, modelFileName)

  await toH264(videoPath, modelPath)

  // 用ffmpeg分离音频
  if (!fs.existsSync(assetPath.ttsTrain)) {
    fs.mkdirSync(assetPath.ttsTrain, {
      recursive: true
    })
  }
  const audioPath = path.join(assetPath.ttsTrain, modelFileName.replace(extname, '.wav'))
  return extractAudio(modelPath, audioPath)
    .then(() => {
      // 训练语音模型
      const relativeAudioPath = path.relative(assetPath.ttsRoot, audioPath)
      if (process.env.NODE_ENV === 'development') {
        // TODO 写死调试
        return trainVoice('origin_audio/test.wav', 'zh')
      } else {
        return trainVoice(relativeAudioPath, 'zh')
      }
    })
    .then((voiceId) => {
      // 插入模特信息
      const relativeModelPath = path.relative(assetPath.model, modelPath)
      const relativeAudioPath = path.relative(assetPath.ttsRoot, audioPath)

      // insert model info to db
      const id = insert({
        modelName,
        videoPath: relativeModelPath,
        audioPath: relativeAudioPath,
        voiceId,
        groupId
      })
      return id
    })
}

function page({ page, pageSize, name = '', groupId = undefined }) {
  const total = count({ name, groupId })
  return {
    total,
    list: selectPage({ page, pageSize, name, groupId }).map((model) => ({
      ...model,
      video_path: path.join(assetPath.model, model.video_path || ''),
      audio_path: path.join(assetPath.ttsRoot, model.audio_path || '')
    }))
  }
}

function findModel(modelId) {
  const model = selectByID(modelId)
  if (!model) return null
  return {
    ...model,
    video_path: path.join(assetPath.model, model.video_path || ''),
    audio_path: path.join(assetPath.ttsRoot, model.audio_path || '')
  }
}

function removeModel(modelId) {
  const model = selectByID(modelId)
  log.debug('~ removeModel ~ modelId:', modelId)
  if (!model) return

  // 删除视频
  const videoPath = path.join(assetPath.model, model.video_path || '')
  if (!isEmpty(model.video_path) && fs.existsSync(videoPath)) {
    try {
      fs.unlinkSync(videoPath)
    } catch (e) {
      log.error('Delete model video error:', e)
    }
  }

  // 删除音频
  const audioPath = path.join(assetPath.ttsRoot, model.audio_path || '')
  if (!isEmpty(model.audio_path) && fs.existsSync(audioPath)) {
    try {
      fs.unlinkSync(audioPath)
    } catch (e) {
      log.error('Delete model audio error:', e)
    }
  }

  deleteModel(modelId)
}

function countModel(param = '') {
  return count(param)
}

export function init() {
  ipcMain.handle(MODEL_NAME + '/addModel', (event, ...args) => {
    return addModel(...args)
  })
  ipcMain.handle(MODEL_NAME + '/page', (event, ...args) => {
    return page(...args)
  })
  ipcMain.handle(MODEL_NAME + '/find', (event, ...args) => {
    return findModel(...args)
  })
  ipcMain.handle(MODEL_NAME + '/count', (event, ...args) => {
    return countModel(...args)
  })
  ipcMain.handle(MODEL_NAME + '/remove', (event, ...args) => {
    return removeModel(...args)
  })
  ipcMain.handle(MODEL_NAME + '/updateGroup', (event, modelId, groupId) => {
    return updateGroup(modelId, groupId)
  })
  ipcMain.handle(MODEL_NAME + '/batchUpdateGroup', (event, modelIds, groupId) => {
    return batchUpdateGroup(modelIds, groupId)
  })

  // 分组管理接口
  ipcMain.handle('model_group/list', () => {
    return groupDao.list()
  })
  ipcMain.handle('model_group/add', (event, name) => {
    return groupDao.insert(name)
  })
  ipcMain.handle('model_group/rename', (event, id, name) => {
    return groupDao.rename(id, name)
  })
  ipcMain.handle('model_group/remove', (event, id) => {
    return groupDao.remove(id)
  })
}
