const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// 从环境变量读取配置（安全方式）
const BOT_TOKEN = process.env.BOT_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://ctlee0712.app.n8n.cloud/webhook/agency_data';

// 检查必要的环境变量
if (!BOT_TOKEN) {
  console.error('❌ 错误：缺少 BOT_TOKEN 环境变量');
  console.error('请在 Railway 项目设置中添加 BOT_TOKEN 环境变量');
  process.exit(1);
}

console.log('🚀 启动 Discord Bot...');
console.log('📡 n8n Webhook URL:', N8N_WEBHOOK_URL);

// 创建 Discord 客户端
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bot 启动成功
client.once('ready', () => {
  console.log(`✅ Bot 已成功上线！`);
  console.log(`🤖 登录为: ${client.user.tag}`);
  console.log(`🌐 服务器数量: ${client.guilds.cache.size}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
});

// 监听消息
client.on('messageCreate', async (message) => {
  // 忽略机器人消息，避免循环
  if (message.author.bot) return;
  
  // 记录收到的消息
  console.log(`📨 收到消息: "${message.content}" 来自 ${message.author.username}`);
  
  try {
    // 准备发送到 n8n 的数据
    const payload = {
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator
      },
      channel: {
        id: message.channel.id,
        name: message.channel.name
      },
      guild: message.guild ? {
        id: message.guild.id,
        name: message.guild.name
      } : null,
      timestamp: new Date().toISOString()
    };
    
    // 发送到 n8n
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10秒超时
    });
    
    console.log(`✅ 消息已成功转发到 n8n`);
    console.log(`📊 响应状态: ${response.status}`);
    
  } catch (error) {
    console.error('❌ 转发到 n8n 失败:');
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应数据:`, error.response.data);
    } else if (error.request) {
      console.error('   网络错误: 无法连接到 n8n');
    } else {
      console.error(`   错误: ${error.message}`);
    }
  }
});

// 错误处理
client.on('error', error => {
  console.error('❌ Discord 客户端错误:', error);
});

client.on('warn', warning => {
  console.warn('⚠️ Discord 警告:', warning);
});

// 全局错误处理
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的 Promise 拒绝:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('🛑 收到停止信号，正在关闭 Bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 收到终止信号，正在关闭 Bot...');
  client.destroy();
  process.exit(0);
});

// 启动 Bot
console.log('🔐 正在登录 Discord...');
client.login(BOT_TOKEN);
