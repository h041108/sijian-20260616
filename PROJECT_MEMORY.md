# ??? 思见 · 即影 — 项目记忆体 (Sijian Project Memory)
#
# 新对话开始前请读取此文件恢复上下文。
# 格式：TOML风格，AI可自动解析。
# 最后更新: 2026-07-18

[PROJECT]
name = "思见 · 即影"
repo = "h041108/sijian-20260616"
workdir = "C:\\Users\\apple\\Documents\\Codex\\2026-07-16\\ni-h\\work\\sijian-20260616"
domain = "jiying.cc.cd"
marketing = "20元开启你的自媒体公司"

[LAST_SESSION]
date = "2026-07-17~18"
action = "多轮部署修复"
last_commit = "5def16a"
build_status = "IN_PROGRESS"

[NAV]
items = ["AI引擎", "每日内容", "即刻影片工厂", "数字人口播", "超级图片社", "素材库", "作品展示", "短剧工坊"]

[WORKFLOWS]
daily_content = "每日3条 + 实体店模式(LLM即行业引擎)"
drama_studio = "Jellyfish剧本分析 -> 合并入微短剧管线"
manga_studio = "5步导演工作流：筹备->故事->分镜->关键帧->合成"
llm_layer = "callLLM统一层：Gemini免费优先 -> DeepSeek备用"

[TECH_DEBT]
P0 = ["导航权限控制 GAP-04", "订阅强制执行 GAP-02", "视频合成升级(Canvas->真视频)"]
P1 = ["TTS配音接入管线", "短剧工坊合并入SetupPanel", "API路由改为callLLM"]

[BUILD_LOG]
2026-07-17_7201b65 = "FAILED: 5个编码/语法错误"
2026-07-17_e243ea3 = "FAILED: page-client末尾重复"
2026-07-17_4f25555 = "FAILED: page-client编码损坏"
2026-07-18_a016fb4 = "FAILED: classNa多行替换"
2026-07-18_6e9f10c = "FAILED: classNa残缺"
2026-07-18_5def16a = "PENDING"
