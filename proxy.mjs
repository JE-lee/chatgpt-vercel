import express from 'express';
import chalk from 'chalk';
import fetch, { Request, Headers } from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';
import httpsProxyAgent from 'https-proxy-agent';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

const streamPipeline = promisify(pipeline);
const { HttpsProxyAgent } = httpsProxyAgent;

const port = 8887;
const app = express();
const router = express.Router();
const host = 'api.openai.com';
const baseUrl = `https://${host}`;
const localProxyServer = 'http://127.0.0.1:7890';

async function proxy(path, req) {
  const headers = new Headers(req.headers);
  headers.set('host', host);
  const request = new Request(`${baseUrl}${path}`, {
    method: req.method,
    headers,
    body: JSON.stringify(req.body),
  });
  const agent = new HttpsProxyAgent(localProxyServer);
  const target = await fetch(request, { agent });
  return target;
}

router.all('/hello', async (req, res) => {
  res.send(`hello world from [path:] ${req.path}`);
});

router.all('/api/**', async (req, res) => {
  try {
    const path = req.originalUrl.slice('/api'.length);
    const target = await proxy(path, req);
    if (target.status !== 200) {
      res.status(target.status);
      res.send(await target.text());
      res.end();
      return;
    }
    await streamPipeline(target.body, res);
  } catch (error) {
    res.status(500);
    res.send(error);
    res.end();
  }
});

app.use(express.json());
app.use('', router);

app.listen(port, () => {
  console.log(chalk.green(`代理服务在 [${port}] 启动成功`));
});
