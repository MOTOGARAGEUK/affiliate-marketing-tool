declare module 'sharetribe-flex-integration-sdk' {
  interface SDKInstance {
    users: {
      query: (params: any) => Promise<any>;
      show: (params: any) => Promise<any>;
      update: (params: any) => Promise<any>;
    };
    listings: {
      query: (params: any) => Promise<any>;
      show: (params: any) => Promise<any>;
      create: (params: any) => Promise<any>;
      update: (params: any) => Promise<any>;
    };
    transactions: {
      query: (params: any) => Promise<any>;
      show: (params: any) => Promise<any>;
    };
    marketplace: {
      show: () => Promise<any>;
    };
  }

  interface CreateInstanceConfig {
    clientId: string;
    clientSecret: string;
  }

  function createInstance(config: CreateInstanceConfig): SDKInstance;

  export = {
    createInstance
  };
} 