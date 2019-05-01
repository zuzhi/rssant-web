<template>
  <div class="scroll-list">
    <mescroll
      ref="mescroll"
      class="mescroll"
      :down="mescrollDown"
      :up="mescrollUp"
      @init="mescrollInit"
    >
      <slot></slot>
    </mescroll>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  props: {
    vid: String,
    itemSize: {
      type: Number,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    initOffset: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    load: {
      type: Function,
      required: true
    }
  },
  data() {
    let pageSize = window.innerHeight - 48
    let numPageItems = Math.ceil(pageSize / this.itemSize)
    return {
      pageSize: pageSize,
      numPageItems: numPageItems,
      isPrevLoading: false,
      isNextLoading: false,
      mescrollDown: {
        auto: false,
        callback: this.onMescrolDown
      },
      mescrollUp: {
        auto: false,
        callback: this.onMescrolUp, // 上拉加载回调
        onScroll: this.onScroll, // 滚动事件回调
        page: {
          num: 0, // 当前页
          size: numPageItems // 每页数据条数
        },
        htmlNodata: '<p class="upwarp-nodata">没有更多了</p>',
        noMoreSize: Math.ceil(numPageItems * 0.5)
      },
      mescroll: null
    }
  },
  computed: {
    pageState() {
      if (_.isNil(this.vid)) {
        return null
      }
      return this.$API.page.of(this.vid)
    },
    offsetAll() {
      return this.items.length * this.itemSize
    },
    hasPrev() {
      if (this.total <= 0) {
        return false
      }
      if (this.items.length <= 0) {
        return true
      }
      let firstOffset = this.items[0].offset
      return firstOffset > 0
    },
    hasNext() {
      if (this.total <= 0) {
        return false
      }
      if (this.items.length <= 0) {
        return true
      }
      let lastOffset = this.items[this.items.length - 1].offset
      return lastOffset < this.total - 1
    }
  },
  destroyed() {
    this.pageState.set('scrollTop', this.mescroll.getScrollTop())
  },
  methods: {
    endSuccess(prevItemsLength) {
      prevItemsLength = _.defaultTo(prevItemsLength, 0)
      let dataSize = this.items.length - prevItemsLength
      this.mescroll.endSuccess(dataSize, this.hasNext)
      let pageNum = Math.ceil(this.items.length / this.numPageItems) - 1
      this.mescroll.setPageNum(pageNum)
      if (!this.hasPrev) {
        this.mescroll.lockDownScroll(true)
      }
      if (!this.hasNext) {
        this.mescroll.lockUpScroll(true)
      }
    },
    loadInit() {
      if (this.total > 0 && this.items.length <= 0) {
        this.load({ offset: this.initOffset, size: this.numPageItems })
          .then(() => {
            this.loadNext()
          })
          .finally(this.endSuccess)
      } else {
        this.endSuccess()
      }
    },
    loadPrev() {
      if (this.isPrevLoading || !this.hasPrev || this.items.length <= 0) {
        this.mescroll.endDownScroll()
        return
      }
      let prevItemsLength = this.items.length
      let firstOffset = this.items[0].offset
      this.isPrevLoading = true
      this.load({ offset: firstOffset - this.numPageItems, size: this.numPageItems }).finally(() => {
        this.isPrevLoading = false
        this.endSuccess(prevItemsLength)
        this.mescroll.endDownScroll()
      })
    },
    loadNext() {
      if (this.isNextLoading || !this.hasNext || this.items.length <= 0) {
        return
      }
      let prevItemsLength = this.items.length
      let lastOffset = this.items[this.items.length - 1].offset
      this.isNextLoading = true
      this.load({ offset: lastOffset + 1, size: this.numPageItems }).finally(() => {
        this.isNextLoading = false
        this.endSuccess(prevItemsLength)
      })
    },
    mescrollInit(mescroll) {
      this.mescroll = mescroll
      this.loadInit()
      if (!_.isNil(this.pageState)) {
        let scrollTop = this.pageState.get('scrollTop')
        if (!_.isNil(scrollTop)) {
          mescroll.setScrollTop(scrollTop)
        }
      }
    },
    onMescrolDown(mescroll) {
      this.loadPrev()
    },
    onMescrolUp(page, mescroll) {
      this.loadNext()
    },
    onScroll(mescroll, y, isUp) {
      if (!isUp || this.isNextLoading || !this.hasNext || this.items.length <= 0) {
        return
      }
      let delta = (this.offsetAll - y) / this.pageSize
      if (delta < 2) {
        this.loadNext()
      }
    }
  }
}
</script>

<style lang="less" scoped>
.mescroll {
  position: fixed;
  top: 48px;
  bottom: 0;
  height: auto;
}
</style>