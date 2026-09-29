import xmlrpc from 'xmlrpc';

const ODOO_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8069';
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD!;

function createRpcClient(path: string) {
  const urlObj = new URL(`${ODOO_URL}${path}`);
  const options = {
    host: urlObj.hostname,
    port: parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search
  };
  
  return urlObj.protocol === 'https:' 
    ? xmlrpc.createSecureClient(options) 
    : xmlrpc.createClient(options);
}

export function getOdooUid(): Promise<number> {
  return new Promise((resolve, reject) => {
    const client = createRpcClient('/xmlrpc/2/common');
    client.methodCall('authenticate', [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}], (error: any, value: any) => {
      if (error) return reject(error);
      resolve(value);
    });
  });
}

export async function executeOdooKw(model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
  const uid = await getOdooUid();
  return new Promise((resolve, reject) => {
    const client = createRpcClient('/xmlrpc/2/object');
    client.methodCall('execute_kw', [ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs], (error: any, value: any) => {
      if (error) return reject(error);
      resolve(value);
    });
  });
}