import Vue from 'vue'
import Vuex from 'vuex'

import { get } from '@/socket'

Vue.use(Vuex)

const rank = target => state => [...state.vtbs].sort((a, b) => {
  if (!state.info[a.mid] && !state.info[b.mid]) {
    return 0
  }
  if (!state.info[a.mid]) {
    return 1
  }
  if (!state.info[b.mid]) {
    return -1
  }
  return target(state, a, b)
})

export default new Vuex.Store({
  state: {
    vtbs: [],
    info: {},
    pastLive: {},
    status: {},
    spiderUpdate: [],
    logs: []
  },
  getters: {
    followerRank: rank((state, a, b) => state.info[b.mid]['follower'] - state.info[a.mid]['follower']),
    liveRank: rank((state, a, b) => 100000000000 * (state.info[b.mid].liveStatus * state.info[b.mid].online - state.info[a.mid].liveStatus * state.info[a.mid].online) + 1000000 * (state.info[b.mid]['guardNum'] - state.info[a.mid]['guardNum']) + state.info[b.mid]['follower'] - state.info[a.mid]['follower'])
  },
  mutations: {
    SOCKET_vtbs(state, data) {
      state.vtbs = [...data]
    },
    SOCKET_info(state, data) {
      let info = { ...state.info }
      for (let i = 0; i < data.length; i++) {
        info[data[i].mid] = data[i]
      }
      state.info = { ...info }
    },
    loadPastLive(state, { mid, time }) {
      state.pastLive = { ...state.pastLive, [mid]: time }
    },
    SOCKET_log(state, data) {
      state.logs.push({ time: (new Date()).toLocaleString(), data })
      if (state.logs.length > 1024) {
        state.logs.shift()
      }
    },
    SOCKET_status(state, data) {
      state.status = { ...state.status, ...data }
    },
    SOCKET_spiderUpdate(state, data) {
      let { spiderId } = data
      let spiderUpdate = [...state.spiderUpdate]
      spiderUpdate[spiderId] = data
      state.spiderUpdate = spiderUpdate
    }
  },
  actions: {
    async SOCKET_info({ commit, dispatch }, info) {
      for (let i = 0; i < info.length; i++) {
        let { mid, liveNum, liveStatus } = info[i]
        if (!liveNum) {
          commit('loadPastLive', { mid, time: 'never' })
        }
        if (!liveStatus && liveNum) {
          dispatch('updatePastLive', { mid, liveNum })
        }
      }
    },
    async updatePastLive({ commit }, { mid, liveNum }) {
      let { time } = await get('live', { mid, num: liveNum })
      commit('loadPastLive', { mid, time })
    }
  }
})
