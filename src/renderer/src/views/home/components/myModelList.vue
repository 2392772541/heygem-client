<template>
  <div class="model-content-box">
    <div class="model-layout">
      <!-- 左侧分组管理栏 -->
      <div class="group-sidebar">
        <div class="group-header">
          <div class="group-title">
            <FolderIcon style="margin-right: 6px; font-size: 16px; color: #434af9" />
            <span>模特分组</span>
          </div>
          <t-button size="small" variant="text" theme="primary" class="add-group-btn" @click="openCreateGroupDialog">
            <template #icon><AddIcon /></template>
            新建
          </t-button>
        </div>

        <div class="group-list noscrollbar">
          <!-- 全部模特 -->
          <div
            class="group-item"
            :class="{ active: state.selectedGroupId === 'all' }"
            @click="selectGroup('all')"
          >
            <div class="item-left">
              <span class="group-dot all-dot"></span>
              <span class="item-name" title="全部模特">全部模特</span>
            </div>
            <span class="item-badge">{{ state.groupData.totalCount }}</span>
          </div>

          <!-- 未分组 -->
          <div
            class="group-item"
            :class="{
              active: state.selectedGroupId === 'ungrouped',
              'drag-over': state.dragOverGroupId === 'ungrouped'
            }"
            @click="selectGroup('ungrouped')"
            @dragover.prevent="onDragOver('ungrouped')"
            @dragleave="onDragLeave('ungrouped')"
            @drop="onDrop('ungrouped')"
          >
            <div class="item-left">
              <span class="group-dot ungrouped-dot"></span>
              <span class="item-name" title="未分组">未分组</span>
            </div>
            <span class="item-badge">{{ state.groupData.ungroupedCount }}</span>
          </div>

          <div class="group-divider"></div>

          <!-- 自定义分组列表 -->
          <div
            v-for="group in state.groupData.groups"
            :key="group.id"
            class="group-item custom-group"
            :class="{
              active: state.selectedGroupId === group.id,
              'drag-over': state.dragOverGroupId === group.id
            }"
            @click="selectGroup(group.id)"
            @dragover.prevent="onDragOver(group.id)"
            @dragleave="onDragLeave(group.id)"
            @drop="onDrop(group.id)"
          >
            <div class="item-left">
              <span class="group-dot custom-dot"></span>
              <span class="item-name" :title="group.name">{{ group.name }}</span>
            </div>
            <div class="item-right">
              <span class="item-badge">{{ group.model_count || 0 }}</span>
              <div class="item-actions">
                <EditIcon class="action-icon edit" title="重命名" @click.stop="openRenameGroup(group)" />
                <DeleteIcon class="action-icon delete" title="删除分组" @click.stop="openDeleteGroup(group)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧模特内容区 -->
      <div class="model-main">
        <div class="form-box">
          <div class="current-group-info">
            <span class="current-title">{{ currentGroupName }}</span>
            <span class="current-count">({{ state.total }})</span>
          </div>
          <t-input
            v-model="state.formData.name"
            class="form-input"
            :placeholder="$t('common.input.enterNamePlaceholder')"
            clearable
            @change="onKeypressFun"
            @clear="modelPageAJax"
          >
            <template #prefix-icon>
              <img src="../../../assets/images/home/select.svg" />
            </template>
          </t-input>
        </div>

        <div class="model-content-table">
          <div v-if="state.total === 0" class="empty">
            <div class="empty-box">
              <img src="../../../assets/images/home/myModelList.svg" />
              <div class="empty-text">
                {{ state.selectedGroupId === 'all' ? $t('common.myModelList.emptyText') : '该分组下暂无模特' }}
              </div>
              <div class="empty-text">
                <span v-if="state.selectedGroupId === 'all'" @click="handleCreateModel">
                  {{ $t('common.myModelList.emptyLinkRouteText') }}
                </span>
                <span v-else class="link-span" @click="selectGroup('all')">
                  查看全部模特
                </span>
                {{ state.selectedGroupId === 'all' ? $t('common.myModelList.emptyRightText') : '，或将已有模特移入此分组' }}
              </div>
            </div>
          </div>
          <div v-else class="table-list">
            <div
              v-for="(item, index) in state.modelList"
              :key="index + 'modelList'"
              class="li"
              draggable="true"
              @dragstart="onModelDragStart($event, item)"
              @dragend="onModelDragEnd"
            >
              <!-- 视频上部分内容 -->
              <div class="img-video comme">
                <div class="img-video-content">
                  <video class="model-video" :src="localUrl.addFileProtocol(item.video_path)"></video>
                </div>
              </div>
              <!-- 下载、移动与预览悬浮层 -->
              <div class="download-preview comme">
                <div class="download-preview-content">
                  <div class="download-button" @click="editVideo(item)">
                    <img src="../../../assets/images/home/video.svg" />
                    <span>{{ $t('common.myModelList.createVideoText') }}</span>
                  </div>
                  <div class="move-button" @click.stop="openMoveModelDialog(item)">
                    <MoveIcon style="font-size: 13px; margin-right: 4px" />
                    <span>移动分组</span>
                  </div>
                  <div class="preview-box" @click="previewVideo(item.video_path)">
                    <img src="../../../assets/images/home/play.svg" />
                    <span>{{ $t('common.myModelList.previewText') }}</span>
                  </div>
                  <div class="delete-video" title="删除模特" @click="delModel(item.id)">
                    <DeleteIcon style="color: #fff; font-size: 12px" />
                  </div>
                </div>
              </div>
              <!-- 视频下部分内容 -->
              <div class="bottom-text">
                <div class="top">
                  <div class="h1" :title="item.name">{{ item.name }}</div>
                  <div
                    class="group-tag"
                    :class="{ 'is-ungrouped': !item.group_name }"
                    :title="item.group_name ? '分组：' + item.group_name : '未分组'"
                  >
                    {{ item.group_name || '未分组' }}
                  </div>
                </div>
                <div class="text">{{ formatDate(item.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="state.total > 0" class="pagination-box">
          <div class="pagination-content">
            <t-config-provider :global-config="locale === 'zh' ? globalZh : globalEn">
              <t-pagination
                v-model="state.current"
                v-model:pageSize="state.pageSize"
                :total="state.total"
                show-jumper
                class="pagination"
                @page-size-change="onPageSizeChange"
                @current-change="onCurrentChange"
              />
            </t-config-provider>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <VideoDialog
      :showVideoDialog="state.showVideoDialog"
      :videoUrl="state.videoUrl"
      @cancel="cancelFun"
    />
    <DeleteDialog ref="deleteDialogRef" @ok="okDelete" />

    <!-- 新建分组弹窗 -->
    <t-dialog
      v-model:visible="state.createGroupVisible"
      header="新建模特分组"
      :confirm-btn="{ content: '确定', loading: state.groupSubmitting }"
      @confirm="handleCreateGroup"
      @cancel="state.createGroupVisible = false"
    >
      <div style="padding: 12px 0">
        <t-input
          v-model="state.newGroupName"
          placeholder="请输入分组名称（最多20字）"
          :maxlength="20"
          autofocus
          @enter="handleCreateGroup"
        />
      </div>
    </t-dialog>

    <!-- 重命名分组弹窗 -->
    <t-dialog
      v-model:visible="state.renameGroupVisible"
      header="重命名分组"
      :confirm-btn="{ content: '保存', loading: state.groupSubmitting }"
      @confirm="handleRenameGroup"
      @cancel="state.renameGroupVisible = false"
    >
      <div style="padding: 12px 0">
        <t-input
          v-model="state.renameGroupName"
          placeholder="请输入新分组名称"
          :maxlength="20"
          autofocus
          @enter="handleRenameGroup"
        />
      </div>
    </t-dialog>

    <!-- 删除分组确认弹窗 -->
    <t-dialog
      v-model:visible="state.deleteGroupVisible"
      header="删除分组确认"
      theme="danger"
      :confirm-btn="{ content: '确认删除', theme: 'danger', loading: state.groupSubmitting }"
      @confirm="handleDeleteGroup"
      @cancel="state.deleteGroupVisible = false"
    >
      <div style="padding: 12px 0; color: #4b5161; line-height: 22px">
        确定要删除分组「<strong style="color: #252525">{{ state.currentOperatingGroup?.name }}</strong>」吗？<br />
        <span style="color: #8b92a3; font-size: 13px">
          删除后，组内的模特将自动移入「未分组」，模特视频等资产不会被删除。
        </span>
      </div>
    </t-dialog>

    <!-- 移动模特分组弹窗 -->
    <t-dialog
      v-model:visible="state.moveModelVisible"
      header="移动模特至分组"
      :confirm-btn="{ content: '确定移动', loading: state.groupSubmitting }"
      @confirm="handleMoveModel"
      @cancel="state.moveModelVisible = false"
    >
      <div style="padding: 12px 0">
        <div style="margin-bottom: 12px; color: #666; font-size: 13px">
          模特名称：<strong style="color: #252525">{{ state.currentMovingModel?.name }}</strong>
        </div>
        <t-select v-model="state.targetGroupId" placeholder="请选择目标分组" style="width: 100%">
          <t-option value="ungrouped" label="未分组" />
          <t-option
            v-for="g in state.groupData.groups"
            :key="g.id"
            :value="g.id"
            :label="g.name"
          />
        </t-select>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { DeleteIcon, FolderIcon, AddIcon, EditIcon, MoveIcon } from 'tdesign-icons-vue-next'
import {
  modelPage,
  removeModel,
  listModelGroups,
  addModelGroup,
  renameModelGroup,
  removeModelGroup,
  updateModelGroup
} from '@renderer/api/index.js'
import { formatDate } from '@renderer/utils/index.js'
import { useRouter } from 'vue-router'
import VideoDialog from '@renderer/views/home/components/videoDialog.vue'
import DeleteDialog from '@renderer/components/deleteDialog.vue'
import { useHomeStore } from '@renderer/stores/home.js'
import { MessagePlugin } from 'tdesign-vue-next'
import { createModel } from '@renderer/components/model-create'
import enConfig from 'tdesign-vue-next/es/locale/en_US'
import zhConfig from 'tdesign-vue-next/es/locale/zh_CN'
import { useI18n } from 'vue-i18n'
import { localUrl } from '@renderer/utils'
import merge from 'lodash/merge'

const { locale, t } = useI18n()
const emit = defineEmits(['submitOK'])

const globalEn = merge(enConfig, {
  pagination: {}
})
const globalZh = merge(zhConfig, {
  pagination: {}
})
const home = useHomeStore()
const router = useRouter()
const deleteDialogRef = ref(null)

const state = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  videoUrl: '',
  showVideoDialog: false,
  isTime: false,
  modelList: [],
  delModelId: '',
  formData: {
    name: ''
  },
  // 分组数据
  selectedGroupId: 'all',
  groupData: {
    groups: [],
    ungroupedCount: 0,
    totalCount: 0
  },
  dragOverGroupId: null,
  draggingModel: null,
  // 弹窗状态
  createGroupVisible: false,
  newGroupName: '',
  renameGroupVisible: false,
  renameGroupName: '',
  deleteGroupVisible: false,
  currentOperatingGroup: null,
  moveModelVisible: false,
  currentMovingModel: null,
  targetGroupId: 'ungrouped',
  groupSubmitting: false
})

const currentGroupName = computed(() => {
  if (state.selectedGroupId === 'all') return '全部模特'
  if (state.selectedGroupId === 'ungrouped') return '未分组'
  const found = state.groupData.groups.find((g) => g.id === state.selectedGroupId)
  return found ? found.name : '全部模特'
})

onMounted(() => {
  loadGroups()
  modelPageAJax()
})

const loadGroups = async () => {
  try {
    const res = await listModelGroups()
    if (res) {
      state.groupData = res
    }
  } catch (error) {
    console.error('加载分组失败:', error)
  }
}

const modelPageAJax = async () => {
  try {
    const res = await modelPage({
      page: state.current,
      pageSize: state.pageSize,
      name: state.formData.name,
      groupId: state.selectedGroupId
    })
    if (res) {
      const { total, list } = res
      state.total = total || 0
      state.modelList = list || []
    }
    // 联动刷新分组统计数
    loadGroups()
  } catch (error) {
    console.error('获取模特列表失败:', error)
  }
}

const selectGroup = (groupId) => {
  state.selectedGroupId = groupId
  state.current = 1
  modelPageAJax()
}

// 新建分组
const openCreateGroupDialog = () => {
  state.newGroupName = ''
  state.createGroupVisible = true
}

const handleCreateGroup = async () => {
  const name = (state.newGroupName || '').trim()
  if (!name) {
    MessagePlugin.warning('请输入分组名称')
    return
  }
  state.groupSubmitting = true
  try {
    await addModelGroup(name)
    MessagePlugin.success('分组创建成功')
    state.createGroupVisible = false
    state.newGroupName = ''
    await loadGroups()
  } catch (error) {
    MessagePlugin.error(error.message || '创建分组失败')
  } finally {
    state.groupSubmitting = false
  }
}

// 重命名分组
const openRenameGroup = (group) => {
  state.currentOperatingGroup = group
  state.renameGroupName = group.name
  state.renameGroupVisible = true
}

const handleRenameGroup = async () => {
  const name = (state.renameGroupName || '').trim()
  if (!name) {
    MessagePlugin.warning('分组名称不能为空')
    return
  }
  state.groupSubmitting = true
  try {
    await renameModelGroup(state.currentOperatingGroup.id, name)
    MessagePlugin.success('重命名成功')
    state.renameGroupVisible = false
    await loadGroups()
    await modelPageAJax()
  } catch (error) {
    MessagePlugin.error(error.message || '重命名失败')
  } finally {
    state.groupSubmitting = false
  }
}

// 删除分组
const openDeleteGroup = (group) => {
  state.currentOperatingGroup = group
  state.deleteGroupVisible = true
}

const handleDeleteGroup = async () => {
  state.groupSubmitting = true
  try {
    await removeModelGroup(state.currentOperatingGroup.id)
    MessagePlugin.success('分组已删除，原组内模特已移入未分组')
    state.deleteGroupVisible = false
    if (state.selectedGroupId === state.currentOperatingGroup.id) {
      state.selectedGroupId = 'all'
    }
    await loadGroups()
    await modelPageAJax()
  } catch (error) {
    MessagePlugin.error(error.message || '删除分组失败')
  } finally {
    state.groupSubmitting = false
  }
}

// 移动模特分组弹窗
const openMoveModelDialog = (model) => {
  state.currentMovingModel = model
  state.targetGroupId = model.group_id ? model.group_id : 'ungrouped'
  state.moveModelVisible = true
}

const handleMoveModel = async () => {
  if (!state.currentMovingModel) return
  state.groupSubmitting = true
  try {
    await updateModelGroup(state.currentMovingModel.id, state.targetGroupId)
    MessagePlugin.success('移动分组成功')
    state.moveModelVisible = false
    await loadGroups()
    await modelPageAJax()
  } catch (error) {
    MessagePlugin.error(error.message || '移动分组失败')
  } finally {
    state.groupSubmitting = false
  }
}

// HTML5 原生拖拽移动模特
const onModelDragStart = (e, item) => {
  e.dataTransfer.setData('text/plain', String(item.id))
  state.draggingModel = item
}

const onModelDragEnd = () => {
  state.draggingModel = null
  state.dragOverGroupId = null
}

const onDragOver = (groupId) => {
  state.dragOverGroupId = groupId
}

const onDragLeave = (groupId) => {
  if (state.dragOverGroupId === groupId) {
    state.dragOverGroupId = null
  }
}

const onDrop = async (groupId) => {
  state.dragOverGroupId = null
  if (!state.draggingModel) return

  const targetGId = groupId === 'ungrouped' ? null : groupId
  if (state.draggingModel.group_id === targetGId) {
    return
  }

  try {
    await updateModelGroup(state.draggingModel.id, groupId)
    MessagePlugin.success('模特已移动至目标分组')
    await loadGroups()
    await modelPageAJax()
  } catch (error) {
    MessagePlugin.error(error.message || '移动分组失败')
  }
}

const handleCreateModel = async () => {
  const { isSubmitOK } = await createModel()
  if (isSubmitOK) {
    emit('submitOK')
    loadGroups()
    modelPageAJax()
  }
}

const okDelete = () => {
  removeModel(state.delModelId)
    .then(() => {
      modelPageAJax()
      MessagePlugin.success(t('common.message.deleteSuccessText'))
      home.setModelNum(home.homeState.modelNum > 0 ? home.homeState.modelNum - 1 : 0)
    })
    .catch((error) => {
      MessagePlugin.error(t('common.message.deleteErrorText'))
      console.error('Error:', error)
    })
}

const delModel = (id) => {
  if (deleteDialogRef.value && deleteDialogRef.value.showDialogFun) {
    deleteDialogRef.value.showDialogFun()
    state.delModelId = id
  }
}

defineExpose({
  modelPageAJax,
  loadGroups
})

const previewVideo = (url) => {
  state.showVideoDialog = true
  state.videoUrl = url
}

const cancelFun = () => {
  state.showVideoDialog = false
}

const onKeypressFun = () => {
  if (!state.isTime) {
    state.isTime = true
    const timeout = setTimeout(() => {
      modelPageAJax()
      state.isTime = false
      clearTimeout(timeout)
    }, 500)
  }
}

const editVideo = (item) => {
  router.push('/video/edit?modelId=' + item.id)
}

const onPageSizeChange = (size) => {
  state.pageSize = size
  modelPageAJax()
}

const onCurrentChange = (index) => {
  state.current = index
  modelPageAJax()
}
</script>

<style lang="less" scoped>
.model-content-box {
  width: 100%;

  .model-layout {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  /* 左侧分组侧边栏 */
  .group-sidebar {
    width: 210px;
    flex-shrink: 0;
    background: #fbfbfd;
    border: 1px solid #eaebef;
    border-radius: 8px;
    padding: 12px 8px;
    box-sizing: border-box;

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 6px 10px 6px;
      border-bottom: 1px solid #f0f1f4;
      margin-bottom: 8px;

      .group-title {
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: 600;
        color: #252525;
      }

      .add-group-btn {
        padding: 0 4px;
        font-size: 12px;
        height: 24px;
      }
    }

    .group-list {
      max-height: 600px;
      overflow-y: auto;

      .group-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 4px;
        border: 1px solid transparent;

        .item-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;

          .group-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            flex-shrink: 0;

            &.all-dot {
              background-color: #434af9;
            }
            &.ungrouped-dot {
              background-color: #adb5bd;
            }
            &.custom-dot {
              background-color: #2ba471;
            }
          }

          .item-name {
            font-size: 13px;
            color: #4b5161;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .item-right {
          display: flex;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .item-badge {
          font-size: 11px;
          color: #8b92a3;
          background: #eff0f4;
          padding: 1px 7px;
          border-radius: 10px;
          min-width: 14px;
          text-align: center;
          line-height: 16px;
        }

        .item-actions {
          display: none;
          align-items: center;
          gap: 4px;

          .action-icon {
            font-size: 13px;
            padding: 2px;
            border-radius: 3px;
            transition: color 0.15s;

            &.edit {
              color: #8b92a3;
              &:hover {
                color: #434af9;
              }
            }
            &.delete {
              color: #8b92a3;
              &:hover {
                color: #e34d59;
              }
            }
          }
        }

        &:hover {
          background: #f0f2f7;

          .item-name {
            color: #252525;
          }

          .item-actions {
            display: flex;
          }

          .item-badge {
            display: none;
          }
        }

        &.active {
          background: #eff3ff;
          border-color: rgba(67, 74, 249, 0.2);

          .item-name {
            color: #434af9;
            font-weight: 600;
          }

          .item-badge {
            background: #dce5ff;
            color: #434af9;
            font-weight: 600;
          }
        }

        &.drag-over {
          border: 1px dashed #434af9 !important;
          background: #e5edff !important;
        }
      }

      .group-divider {
        height: 1px;
        background: #f0f1f4;
        margin: 8px 4px;
      }
    }
  }

  /* 右侧主体 */
  .model-main {
    flex: 1;
    min-width: 0;

    .form-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .current-group-info {
        display: flex;
        align-items: center;
        gap: 6px;

        .current-title {
          font-size: 15px;
          font-weight: 600;
          color: #252525;
        }
        .current-count {
          font-size: 13px;
          color: #8b92a3;
        }
      }

      .form-input {
        width: 260px;
        border-radius: 4px;
      }
    }
  }

  .model-content-table {
    min-height: 480px;

    .empty {
      width: 100%;
      height: 420px;
      display: flex;
      justify-content: center;
      align-items: center;
      .empty-box {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        img {
          width: 180px;
          height: 120px;
          margin-bottom: 12px;
        }
        .empty-text {
          font-size: 14px;
          color: #8b92a3;
          line-height: 24px;
          span {
            color: #434af9;
            cursor: pointer;
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }

    .table-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 16px;
      padding-bottom: 30px;

      .li {
        transition: all 0.25s ease;
        aspect-ratio: 1 / 0.85;
        border-radius: 8px;
        position: relative;
        cursor: grab;
        border: 1px solid #eaebef;
        background: #fff;
        overflow: hidden;

        &:active {
          cursor: grabbing;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);

          .download-preview {
            z-index: 2;
            background: rgba(0, 0, 0, 0.65);
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: calc(100% - 62px);
            backdrop-filter: blur(2px);
          }
        }

        .download-preview {
          display: none;

          .download-preview-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;

            .delete-video {
              cursor: pointer;
              position: absolute;
              top: 8px;
              right: 8px;
              width: 26px;
              height: 26px;
              border-radius: 4px;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s;
              &:hover {
                background: #e34d59;
              }
            }

            .download-button {
              width: 90px;
              height: 30px;
              cursor: pointer;
              background: linear-gradient(360deg, #3c73ff 0%, #434af9 100%);
              border-radius: 4px;
              font-weight: 500;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #ffffff;
              gap: 4px;
              transition: opacity 0.2s;
              &:hover {
                opacity: 0.9;
              }
            }

            .move-button {
              width: 90px;
              height: 28px;
              cursor: pointer;
              background: rgba(255, 255, 255, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.6);
              border-radius: 4px;
              font-weight: 500;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #ffffff;
              gap: 4px;
              transition: background 0.2s;
              &:hover {
                background: rgba(255, 255, 255, 0.35);
              }
            }

            .preview-box {
              cursor: pointer;
              font-size: 12px;
              display: flex;
              align-items: center;
              color: #ffffff;
              gap: 4px;
              margin-top: 2px;
              opacity: 0.85;
              &:hover {
                opacity: 1;
                text-decoration: underline;
              }
            }
          }
        }

        .comme {
          position: absolute;
          top: 0;
          width: 100%;
          left: 0;
          border-radius: 8px 8px 0 0;
          height: calc(100% - 62px);
        }

        .img-video {
          z-index: 1;
          background: #f0f2f5;

          .img-video-content {
            position: relative;
            height: 100%;
            .model-video {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
          }
        }

        .bottom-text {
          position: absolute;
          bottom: 0;
          padding: 8px 10px;
          left: 0;
          width: 100%;
          height: 62px;
          background: #ffffff;
          box-sizing: border-box;
          border-top: 1px solid #f2f2f5;

          .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            margin-bottom: 4px;

            .h1 {
              font-weight: 600;
              font-size: 13px;
              color: #252525;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 1;
            }

            .group-tag {
              display: inline-block;
              padding: 1px 6px;
              border-radius: 4px;
              font-size: 11px;
              background: #eff3ff;
              color: #434af9;
              max-width: 75px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              flex-shrink: 0;

              &.is-ungrouped {
                background: #f1f2f5;
                color: #8b92a3;
              }
            }
          }

          .text {
            font-size: 11px;
            color: rgba(37, 37, 37, 0.45);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

  .pagination-box {
    position: sticky;
    z-index: 10;
    height: 46px;
    width: 100%;
    bottom: -16px;
    left: 0;
    background-color: #fff;
    .pagination-content {
      justify-content: center;
      display: flex;
      height: 46px;
      align-items: center;
    }
  }
}
</style>
