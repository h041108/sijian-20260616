# 思见提示词引擎库 · 总索引

## 15引擎完整清单

### 内容生产层（9个）
| ID | 引擎 | 触发条件 | 文件 |
|----|------|---------|------|
| E01 | 商业策略分析师 | 选择"创始人解析" | content/E01-founder-analysis.md |
| E02 | 通用人设专家 | 新账号/赛道选择 | content/E02-persona-modeling.md |
| E03 | 对标文案拆解 | 提供对标内容 | content/E03-competitor-analysis.md |
| E04 | 视频提示词大师 | 即影prompt_engineering阶段 | content/E04-video-prompt.md |
| E05 | 视频脚本分镜导演 | 选题确认后 | content/E05-shot-director.md |
| E11 | 爆款标题拆解师 | 输入标题分析 | content/E11-title-analyzer.md |
| E12 | 爆款内容复刻师 | 对标爆款差异化 | content/E12-content-replicator.md |
| E14 | 爆款封面灵感师 | 视频生成后 | content/E14-cover-designer.md |
| E15 | 选题分析师 | 每日选题 | content/E15-topic-generator.md |

### 音视制作层（2个）
| ID | 引擎 | 触发条件 | 文件 |
|----|------|---------|------|
| E06 | BGM作曲家 | 分镜确立后 | audio/E06-bgm-composer.md |
| E07 | 音效大师 | 场景音效设计 | audio/E07-sound-designer.md |

### 数据运营层（3个）
| ID | 引擎 | 触发条件 | 文件 |
|----|------|---------|------|
| E08 | 数据分析运营 | 上传视频数据 | data/E08-data-analytics.md |
| E09 | 投流分析运营 | 上传广告数据 | data/E09-ad-optimizer.md |
| E13 | 评论分析运营 | 上传评论数据 | data/E13-comment-analytics.md |

### 战略分析层（1个）
| ID | 引擎 | 触发条件 | 文件 |
|----|------|---------|------|
| E10 | 知识图谱专家 | 行业分析 | strategy/E10-knowledge-graph.md |

---

## 自动化流水线

```
输入：用户选赛道+平台
  ↓
E02 人设建模 → E03 对标拆解 → E15 每日选题
                                    ↓
                            用户确认选题
                                    ↓
                    E05 分镜导演 → E04 提示词工程
                                    ↓
                              即影生成视频
                                    ↓
                    E06 BGM ← → E14 封面
                                    ↓
                          发布 + E13 评论运营
                                    ↓
                    E08 数据分析 ← E09 投流优化
```
