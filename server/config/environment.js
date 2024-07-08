const GetParametersStore = require('./parameter-store-envs');
const localEnvs = require('./local-envs');

class Environments {
  static instance;

  constructor() {
    this.envs = {};
  }

  static getInstance() {
    if (!Environments.instance) {
      Environments.instance = new Environments();
    }

    return Environments.instance;
  }

  async populateAllEnvs() {
    await GetParametersStore.populate();
    const getAllParamStore = GetParametersStore.getAll();
    const getLocalEnvs = localEnvs;

    this.envs = {
      ...getAllParamStore,
      ...getLocalEnvs
    }
  }

  getAll() {
    return this.envs;
  }

  getValue(value) {
    return this.envs[value];
  }
}

module.exports = Environments.getInstance();