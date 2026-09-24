<template>
  <div class="select">
    <div class="select-header">{{ $t('common.selectView.selectHeaderText') }}</div>
    <div class="select-body">
      <!-- 分组筛选下拉框 -->
      <div class="group-filter-box">
        <t-select
          v-model="state.groupId"
          class="group-select"
          :placeholder="'全部分组'"
          @change="action.onGroupChange"
        >
          <t-option value="all" :label="`全部分组 (${state.totalCount})`" />
          <t-option value="ungrouped" :label="`未分组 (${state.ungroupedCount})`" />
          <t-option
            v-for="group in state.groupList"
            :key="group.id"
            :value="group.id"
            :label="`${group.name} (${group.model_count || 0})`"
          />
        </t-select>
      </div>

      <!-- 搜索框 -->
      <t-input
        class="model-search"
        v-model="state.search"
        :placeholder="$t('common.input.searchAvatarNamePlaceholder')"
        clearable
        @change="action.searchList"
        @clear="action.searchList"
      >
        <template #prefix-icon>
          <SearchIcon />
        </template>
      </t-input>

      <div class="model-scroll noscrollbar">
        <!-- 创建模特 -->
        <div class="model-create">
          <t-image class="image" :src="ModelPng" />
          <t-button theme="default" class="btn" @click="action.onCreateModel">{{
            $t('common.selectView.generateButtonText')
          }}</t-button>
        </div>
        <!-- 模特列表 -->
        <div class="model-list">
          <div
            v-for="model in data.modelList"
            :key="model.id"
            class="model-list__item"
            :model-id="model.id"
            :class="{ '--active': data.model?.id === model.id }"
            @click="action.selectModel(model)"
          >
            <video class="video" :src="localUrl.addFileProtocol(model.video_path)" />
            <div class="item-info">
              <div class="name" :title="model.name">{{ model.name }}</div>
              <div v-if="model.group_name" class="group-tag-dark" :title="model.group_name">
                {{ model.group_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import ModelPng from '@renderer/assets/images/video-edit/create-model.png'
import { SearchIcon } from 'tdesign-icons-vue-next'
import { createModel } from '@renderer/components/model-create'
import { listModelGroups } from '@renderer/api/index.js'
import { useRouter } from 'vue-router'
import { localUrl } from '@renderer/utils'

const router = useRouter()
const data = defineModel({})

const state = reactive({
  search: '',
  groupId: 'all',
  groupList: [],
  ungroupedCount: 0,
  totalCount: 0
})

const emits = defineEmits(['query'])

const action = {
  async loadGroups() {
    try {
      const res = await listModelGroups()
      if (res) {
        state.groupList = res.groups || []
        state.ungroupedCount = res.ungroupedCount || 0
        state.totalCount = res.totalCount || 0
      }
    } catch (e) {
      console.error('加载分组失败:', e)
    }
  },
  onGroupChange(val) {
    localStorage.setItem('heygem_last_model_group', val)
    action.searchList()
  },
  async searchList() {
    emits('query', { name: state.search, groupId: state.groupId })
  },
  selectModel(model) {
    data.value.model = model
  },
  async onCreateModel() {
    const { isSubmitOK_toSee, isSubmitOK } = await createModel()
    if (isSubmitOK_toSee) {
      router.push('/home?type=model')
    } else if (isSubmitOK) {
      await action.loadGroups()
      await action.searchList()
    }
  }
}

onMounted(async () => {
  await action.loadGroups()
  const savedGroup = localStorage.getItem('heygem_last_model_group')
  if (savedGroup) {
    // 检查是否在有效分组中或者为 all/ungrouped
    const valid =
      savedGroup === 'all' ||
      savedGroup === 'ungrouped' ||
      state.groupList.some((g) => String(g.id) === String(savedGroup))
    if (valid) {
      state.groupId = savedGroup === 'all' || savedGroup === 'ungrouped' ? savedGroup : Number(savedGroup)
    }
  }
  action.searchList()
})
</script>

<style lang="less" scoped>
.select {
  display: flex;
  height: 100%;
  flex-direction: column;

  &-header {
    font-weight: 500;
    padding: 18px;
    font-size: 14px;
    color: #ffffff;
    line-height: 22px;
    text-align: center;
    border-bottom: 1px solid #000000;
  }

  &-body {
    flex: 1;
    padding: 16px 19px 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .group-filter-box {
    flex: none;
    margin-bottom: 12px;

    .group-select {
      width: 100%;
      --td-bg-color-specialcomponent: #1d1e20;
      --td-text-color-primary: #ffffff;
      --td-text-color-placeholder: rgba(255, 255, 255, 0.6);

      :deep(.t-input) {
        background-color: #1d1e20;
        border-color: rgba(255, 255, 255, 0.3);
        color: #ffffff;
        border-radius: 4px;
      }

      :deep(.t-input:hover) {
        border-color: var(--td-brand-color);
      }

      :deep(.t-select__single) {
        color: #ffffff;
      }

      :deep(.t-fake-arrow) {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .model {
    &-search {
      flex: none;
      margin-bottom: 16px;
      --td-bg-color-specialcomponent: #1d1e20;
      --td-text-color-primary: #ffffff;
      --td-text-color-placeholder: rgba(255, 255, 255, 0.6);

      :deep(.t-input) {
        background-color: #1d1e20;
        border-color: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }

      :deep(.t-input--focused) {
        box-shadow: none;
      }
    }

    &-scroll {
      flex: 1;
      overflow: auto;
    }

    &-create {
      width: 100%;
      height: 238px;
      background: #17181a;
      border-radius: 4px 4px 4px 4px;
      border: 1px solid #27292d;
      display: flex;
      align-items: center;
      flex-direction: column;
      justify-content: center;
      gap: 12px;

      --td-bg-color-secondarycontainer: transparent;

      .image {
        width: 148px;
        height: 92px;
      }

      .btn {
        background: #27292d;
        font-size: 12px;
        color: #ffffff;
        border: none;
      }
    }

    &-list__item {
      width: 100%;
      height: 238px;
      background: #17181a;
      border-radius: 4px 4px 4px 4px;
      border: 1px solid #27292d;
      margin-top: 16px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s;

      &.--active {
        border: 1px solid var(--td-brand-color);
      }

      &:last-of-type {
        margin-bottom: 21px;
      }

      .item-info {
        width: 90%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .name {
        width: 100%;
        font-size: 14px;
        color: #ffffff;
        line-height: 20px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .group-tag-dark {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.65);
        background: rgba(255, 255, 255, 0.12);
        padding: 1px 8px;
        border-radius: 10px;
        max-width: 85%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .video {
        max-width: 100%;
        max-height: 75%;
        border-radius: 4px;
      }
    }
  }
}
</style>
