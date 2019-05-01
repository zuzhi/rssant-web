import _ from 'lodash'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

class StoreBuilder {

    constructor() {
        this.drivers = []
    }

    mount(name, stateDriver) {
        this.drivers.push([name, stateDriver])
    }

    build() {
        const rootState = {}
        const rootGetters = {}
        const rootMutations = {}
        const API = {}
        this.drivers.forEach(([name, stateDriver]) => {
            rootState[name] = stateDriver.state
            API[name] = {}
            let DAO = {}
            Object.defineProperty(DAO, 'state', {
                get: function () { return STORE.state[name] }
            })
            _.entries(stateDriver.getters).forEach(([getterName, getterFunc]) => {
                let key = name + '/' + getterName
                rootGetters[key] = (state) => getterFunc(state[name])
                Object.defineProperty(DAO, getterName, {
                    get: function () { return STORE.getters[key] }
                });
                Object.defineProperty(API[name], getterName, {
                    get: function () { return STORE.getters[key] }
                });
            })
            _.entries(stateDriver.mutations).forEach(([mutationName, mutationFunc]) => {
                let key = name + '/' + mutationName
                rootMutations[key] = (state, payload) => mutationFunc(state[name], payload)
                API[name][mutationName] = DAO[mutationName] = function (payload) {
                    return STORE.commit(key, payload)
                }
            })
            _.entries(stateDriver.actions).forEach(([actionnName, actionnFunc]) => {
                API[name][actionnName] = function (payload) {
                    return actionnFunc(DAO, payload)
                }
            })
        })
        const STORE = new Vuex.Store({
            state: rootState,
            getters: rootGetters,
            mutations: rootMutations,
        })
        return [STORE, API]
    }

}

export default StoreBuilder