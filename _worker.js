export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let myToken = await env.CDNIP.get("TOKEN");

        if (!myToken || url.pathname == `/${myToken}/edit`) {
            return await showEditPage(request, env, myToken);
        }

        if (url.pathname != '/' + myToken || url.pathname.startsWith('/' + myToken + '?')) {
            return new Response('Unauthorized', { status: 401 });
        }

        return await showConfig(env, url);
    }
};

async function showEditPage(request, env, myToken) {
    let successMessage = '';
    let showSubscribeUrl = false;
    let subscribeUrl = '';
    let newSubscribeUrl = '';

    if (request.method === 'POST') {
        const formData = await request.formData();

        const uuid = formData.get('uuid');
        const addresses = formData.get('addresses');
        const port = formData.get('port');
        const wsHost = formData.get('wsHost');
        const wsPath = formData.get('wsPath');
        const token = formData.get('token');

        // 保存到 KV 存储
        await env.CDNIP.put("C_UUID", uuid);
        await env.CDNIP.put("ADDRS", addresses);
        await env.CDNIP.put("C_PORT", port);
        await env.CDNIP.put("C_WS_HOST", wsHost);
        await env.CDNIP.put("C_WS_PATH", wsPath);
        await env.CDNIP.put("TOKEN", token);

        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0];
        successMessage = `保存成功，时间：${timeString}`;
        
        // 如果是首次设置 TOKEN，显示订阅地址
        if (myToken != token) {
            showSubscribeUrl = true;
            const currentUrl = new URL(request.url);
            newSubscribeUrl = `${currentUrl.protocol}//${currentUrl.host}/${token}`;
        }
    }
    const currentUrl = new URL(request.url);
    subscribeUrl = `${currentUrl.protocol}//${currentUrl.host}/${myToken}`;
    // 从 KV 存储读取配置
    const storedUuid = await env.CDNIP.get("C_UUID") || '';
    const storedAddresses = await env.CDNIP.get("ADDRS") || '';
    const storedPort = await env.CDNIP.get("C_PORT") || '';
    const storedWsHost = await env.CDNIP.get("C_WS_HOST") || '';
    const storedWsPath = await env.CDNIP.get("C_WS_PATH") || '';
    const storedToken = await env.CDNIP.get("TOKEN") || '';

    // 返回编辑页面的 HTML
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>编辑页面</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    width: 600px;
                }
                .subscribe-url {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
                .subscribe-url h3 {
                    margin-top: 0;
                    color: #333;
                }
                .url-text {
                    word-break: break-all;
                    color: #007bff;
                }
                h1 {
                    text-align: left;
                    color: #333;
                    font-size: 20px;
                }
                .form-group {
                    display: flex;
                    align-items: center;
                    margin: 10px 0;
                }
                label {
                    margin-right: 10px;
                    color: #555;
                    width: 150px;
                }
                input[type="text"], textarea {
                    width: 96%;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                input[type="submit"] {
                    background-color: #5cb85c;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    width: 100%;
                }
                input[type="submit"]:hover {
                    background-color: #4cae4c;
                }
            </style>
            <script>
                window.onload = function() {
                    ${successMessage ? `alert('${successMessage}');` : ''}
                    ${showSubscribeUrl ? `
                        setTimeout(() => {
                            window.location.href = '${newSubscribeUrl}/edit';
                        }, 1500);
                    ` : ''}
                };
            </script>
        </head>
        <body>
            <div class="container">
                <h1>订阅地址</h1>
                <div>
                    地址：${subscribeUrl}
                </div>
                <h1>编辑配置</h1>
                ${showSubscribeUrl ? `
                    <div class="subscribe-url">
                        <h3>订阅地址已生成</h3>
                        <p>您的订阅地址为：</p>
                        <p class="url-text">${newSubscribeUrl}</p>
                        <p>页面将在几秒后自动跳转...</p>
                    </div>
                ` : ''}
                <form method="POST" action="/${myToken}/edit">
                    <div class="form-group">
                        <label for="token">TOKEN:</label>
                        <input type="text" id="token" name="token" value="${storedToken}" required>
                    </div>
                    <div class="form-group">
                        <label for="uuid">UUID:</label>
                        <input type="text" id="uuid" name="uuid" value="${storedUuid}" required>
                    </div>
                    <div class="form-group">
                        <label for="wsHost">域名:</label>
                        <input type="text" id="wsHost" name="wsHost" value="${storedWsHost}" required>
                    </div>
                    <div class="form-group">
                        <label for="port">端口:</label>
                        <input type="text" id="port" name="port" value="${storedPort}" required>
                    </div>
                    <div class="form-group">
                        <label for="wsPath">PATH:</label>
                        <input type="text" id="wsPath" name="wsPath" value="${storedWsPath}" required>
                    </div>
                    <div class="form-group" style="align-items: start;">
                        <label for="addresses">CDN IP 地址 (格式: IP#名称，每行一条):</label>
                        <textarea id="addresses" name="addresses" required rows="10">${storedAddresses}</textarea>
                    </div>
                    <input type="submit" value="保存">
                </form>
            </div>
        </body>
        </html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

async function showConfig(env, url) {
    let config = await genConfig(env);
    const isDebug = url.searchParams.has('debug');
    return new Response(isDebug ? config : btoa(config));
}

async function genVmessUrl(env, address, name) {
    let config = {
        "v": "2",
        "ps": name || "vm",
        "add": address.trim(),
        "port": await env.CDNIP.get("C_PORT"),
        "id": await env.CDNIP.get("C_UUID"),
        "aid": "0",
        "scy": "auto",
        "net": "ws",
        "type": "none",
        "host": await env.CDNIP.get("C_WS_HOST"),
        "path": await env.CDNIP.get("C_WS_PATH"),
        "tls": "",
        "sni": "",
        "alpn": "",
        "fp": ""
    };

    // 将 config 对象转换为 JSON 字符串
    const configJson = JSON.stringify(config);
    // 将 JSON 字符串进行 Base64 编码
    const base64Config = btoa(configJson);
    // 生成 vmess URL
    const vmessUrl = `vmess://${base64Config}`;
    return vmessUrl;
}

async function genVBlessUrl(env, address, name) {
    // 从环境变量获取配置
    const uuid = await env.CDNIP.get("C_UUID");
    const port = await env.CDNIP.get("C_PORT");
    const wsHost = await env.CDNIP.get("C_WS_HOST");
    const wsPath = await env.CDNIP.get("C_WS_PATH");

    // 构建参数对象
    const params = {
        type: 'ws',
        path: encodeURIComponent(wsPath),
        host: encodeURIComponent(wsHost),
        security: 'tls',
        fp: 'chrome',
        alpn: 'h2,http/1.1',
        sni: encodeURIComponent(wsHost)
    };

    // 将参数对象转换为 URL 查询字符串
    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    // 生成完整的 URL
    const vblessUrl = "v" + `less://${uuid}@${address}:${port}?${queryString}#${encodeURIComponent(name)}`;
    
    return vblessUrl;
}

async function genConfig(env) {
    // 从环境变量中获取 IP 地址
    const addrs = await env.CDNIP.get("ADDRS") || "";
    const addressEntries = addrs.split('\n');

    let urls = [];
    for (let entry of addressEntries) {
        entry = entry.trim();
        if (entry == "") {
            continue;
        }
        var [ip, name] = entry.split('#'); // 分割 IP 和名称
        ip = ip.trim();
        name = name || "name";
        name = name.trim();
        // urls.push(await genVmessUrl(env, ip, name));
        urls.push(await genVBlessUrl(env, ip, name));
    }

    // 将所有 URL 连接为字符串，每行一个
    const result = urls.join('\n');
    return result;
}