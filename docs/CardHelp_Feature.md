# CardHelp 卡牌辅助功能规格

## 1. 功能目标

CardHelp 是 Warhammer Underworlds 社群辅助功能，用来降低新手因为英文卡牌而产生的入门门槛。

玩家在对局中经常需要用手机翻译英文卡牌，但普通翻译只能翻文字，不能解释这张卡在游戏中的实际用途、使用时机和新手注意点。因此 CardHelp 的目标不是取代官方卡牌，而是提供 **中文白话解释 + 使用时机 + 新手提醒**。

本功能应该优先服务 Aexern 小型社群，方便 Host 手动维护常用卡牌说明，玩家只能查看。

---

## 2. 核心原则

### 2.1 不做完整卡牌数据库

当前阶段不需要导入全部 Warhammer Underworlds 卡牌。Host 可以根据实际玩家使用情况，逐步手动添加常见卡牌。

### 2.2 不替代官方卡牌

CardHelp 只做中文教学辅助，不应该公开保存完整官方英文卡牌文本、完整逐字中文翻译或官方卡图。

建议在页面底部显示免责声明：

> 非官方中文教学辅助资料，仅供 Aexern 社群学习 Warhammer Underworlds 使用。请以官方英文卡牌和规则书为准。

### 2.3 玩家只读，Host 可维护

- Host 可以新增、编辑、删除、发布、隐藏卡牌辅助资料。
- 玩家只能浏览和搜索，不能新增或修改。

---

## 3. 路由设计

### 3.1 Host 管理入口

```txt
/host/card-help
```

用途：Host 管理 CardHelp 资料。

Host 可以：

- 查看所有卡牌辅助资料
- 新增卡牌说明
- 编辑卡牌说明
- 删除卡牌说明
- 设置是否公开显示
- 搜索卡名
- 按标签筛选

### 3.2 玩家查看入口

```txt
/card-help
```

用途：玩家查看 CardHelp。

玩家可以：

- 搜索卡名
- 查看中文白话解释
- 查看使用时机
- 查看新手提醒
- 按标签筛选

玩家不可以：

- 新增资料
- 编辑资料
- 删除资料
- 看到隐藏状态的卡牌资料

---

## 4. 功能范围 MVP

### 4.1 必须实现

- Host 可以在 `/host/card-help` 手动新增卡牌辅助资料
- Host 可以编辑已存在资料
- Host 可以删除资料
- Host 可以设置资料是否公开
- 玩家可以在 `/card-help` 查看公开资料
- 玩家可以搜索英文卡名
- 玩家可以根据标签筛选
- 页面必须 mobile friendly
- 资料必须保存到数据库或当前项目已使用的持久化储存

### 4.2 暂时不做

- 不做 OCR 扫描卡牌
- 不做自动翻译
- 不做完整卡牌图片上传
- 不做官方卡牌全文收录
- 不做玩家投稿功能
- 不做 AI 自动解释功能
- 不做评论系统
- 不做点赞系统

---

## 5. 资料字段设计

每一张 CardHelp 资料包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid/string | 是 | 唯一 ID |
| card_name | string | 是 | 英文卡名 |
| chinese_summary | text | 是 | 中文白话解释 |
| timing | string/text | 是 | 使用时机 |
| beginner_tip | text | 否 | 新手提醒 |
| tags | string[] | 是 | 卡牌标签 |
| warband_name | string | 否 | 相关战队 |
| deck_name | string | 否 | 相关卡组 |
| format | string | 否 | Rivals / Nemesis / Both / Unknown |
| is_public | boolean | 是 | 是否公开给玩家查看 |
| created_at | datetime | 是 | 创建时间 |
| updated_at | datetime | 是 | 更新时间 |

---

## 6. 标签设计

CardHelp MVP 固定使用以下标签：

```txt
攻击卡
防守卡
得分卡
陷阱卡
反应卡
```

### 6.1 标签解释

| 标签 | 用途 |
|---|---|
| 攻击卡 | 帮助攻击、击杀、提高命中或伤害 |
| 防守卡 | 保护自己、减少被击杀风险、增加生存能力 |
| 得分卡 | 帮助完成 Objective 或获得 Glory |
| 陷阱卡 | 诱导对手犯错、制造位置或时机陷阱 |
| 反应卡 | 需要在特定触发时机使用 |

一张卡可以拥有多个标签，例如：

```txt
得分卡 + 反应卡
攻击卡 + 陷阱卡
防守卡 + 反应卡
```

---

## 7. Host 表单设计

### 7.1 新增 / 编辑表单字段

Host 在 `/host/card-help` 点击 Add Card Help 后，显示表单：

```txt
Card Name *
例如：Determined Effort

中文白话解释 *
例如：这张卡大概是让你的攻击更稳定，适合在你准备关键攻击或需要击杀敌人时使用。

使用时机 *
例如：通常在 Power Step 使用，或在你准备进行关键攻击前使用。

新手提醒
例如：不要太早浪费，最好等到你已经有明确攻击目标时才使用。

标签 *
[ ] 攻击卡
[ ] 防守卡
[ ] 得分卡
[ ] 陷阱卡
[ ] 反应卡

相关战队
例如：Skinnerkin

相关卡组
例如：Embergard Rivals Deck

Format
- Unknown
- Rivals
- Nemesis
- Both

公开显示
[ ] Show to players
```

### 7.2 表单验证

必须验证：

- Card Name 不可为空
- 中文白话解释不可为空
- 使用时机不可为空
- 至少选择一个标签
- chinese_summary 建议限制 500 字以内
- beginner_tip 建议限制 300 字以内
- card_name 建议限制 120 字以内

---

## 8. 玩家端 UI 设计

### 8.1 玩家页结构

`/card-help` 页面建议结构：

```txt
CardHelp 卡牌辅助
用中文快速理解常见英文卡牌

[Search card name...]

标签筛选：
[全部] [攻击卡] [防守卡] [得分卡] [陷阱卡] [反应卡]

Card List
```

### 8.2 卡牌显示卡片

每张资料以卡片形式显示：

```txt
Determined Effort
[攻击卡] [反应卡]

中文白话解释
这张卡大概是让你的关键攻击更稳定，适合在你准备击杀敌人或完成目标时使用。

使用时机
Power Step / 攻击前 / 特定触发时机

新手提醒
不要一抽到就马上用。等到你有明确目标，或者这次攻击会影响得分时再使用。

Warband: Skinnerkin
Format: Rivals
```

### 8.3 空状态

如果没有资料：

```txt
还没有 CardHelp 资料。
Host 可以在 /host/card-help 添加常见卡牌说明。
```

如果搜索没有结果：

```txt
找不到相关卡牌说明。
你可以问 Host 是否可以加入这张卡的中文辅助说明。
```

---

## 9. Host 管理 UI 设计

### 9.1 Host 页面结构

`/host/card-help` 页面建议结构：

```txt
Host · CardHelp 管理
管理玩家可查看的中文卡牌辅助资料

[Add Card Help]
[Search card name...]
[Filter: All / Public / Hidden]
[Tag filter]

Card Help Table / Card List
```

### 9.2 Host 列表显示

Host 页面每张资料显示：

```txt
Card Name
Tags
Warband
Format
Status: Public / Hidden
Updated At

[Edit] [Hide/Publish] [Delete]
```

### 9.3 删除确认

删除前必须确认：

```txt
确定要删除这张 CardHelp 资料吗？这个操作不能复原。
```

---

## 10. 数据库建议

如果项目使用 Supabase，可新增 table：

```sql
create table if not exists card_help_entries (
  id uuid primary key default gen_random_uuid(),
  card_name text not null,
  chinese_summary text not null,
  timing text not null,
  beginner_tip text,
  tags text[] not null default '{}',
  warband_name text,
  deck_name text,
  format text default 'Unknown',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Recommended index:

```sql
create index if not exists idx_card_help_entries_card_name
on card_help_entries using gin (to_tsvector('english', card_name));

create index if not exists idx_card_help_entries_tags
on card_help_entries using gin (tags);

create index if not exists idx_card_help_entries_is_public
on card_help_entries (is_public);
```

### 10.1 Format 约束

```sql
alter table card_help_entries
add constraint card_help_entries_format_check
check (format in ('Unknown', 'Rivals', 'Nemesis', 'Both'));
```

### 10.2 Updated At Trigger

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_card_help_entries_updated_at
before update on card_help_entries
for each row
execute function set_updated_at();
```

---

## 11. Supabase RLS 建议

如果当前项目暂时没有正式 login，可以先使用 app-level host gate，例如 `/host` passcode 或 local host token。长期建议使用 Supabase Auth + admin role。

MVP 可先做到：

- 玩家端 query 永远只读取 `is_public = true`
- Host 端才允许 insert/update/delete
- 不要在玩家端暴露新增、编辑、删除按钮

如果已经使用 Supabase Auth，可开启 RLS：

```sql
alter table card_help_entries enable row level security;
```

玩家读取公开资料：

```sql
create policy "Public can view public card help entries"
on card_help_entries
for select
using (is_public = true);
```

Host 管理策略需要根据项目现有 auth/admin 设计实现，例如使用 `profiles.role = 'host'` 或 allowlist email。

---

## 12. 推荐组件拆分

```txt
src/features/card-help/
  CardHelpPlayerPage.tsx
  CardHelpHostPage.tsx
  CardHelpForm.tsx
  CardHelpCard.tsx
  CardHelpTagFilter.tsx
  cardHelpService.ts
  cardHelpTypes.ts
```

### 12.1 Types

```ts
export type CardHelpTag =
  | '攻击卡'
  | '防守卡'
  | '得分卡'
  | '陷阱卡'
  | '反应卡';

export type CardHelpFormat = 'Unknown' | 'Rivals' | 'Nemesis' | 'Both';

export interface CardHelpEntry {
  id: string;
  card_name: string;
  chinese_summary: string;
  timing: string;
  beginner_tip?: string | null;
  tags: CardHelpTag[];
  warband_name?: string | null;
  deck_name?: string | null;
  format: CardHelpFormat;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 13. Search 行为

玩家端和 Host 端都应该支持搜索：

- 搜索 card_name
- 搜索 warband_name
- 搜索 deck_name
- 搜索 chinese_summary

MVP 可以先用前端 filter 实现。

数据量变多后，再改成数据库 search。

---

## 14. 资料示例

### 14.1 Example Entry

```json
{
  "card_name": "Example Card Name",
  "chinese_summary": "这张卡大概是帮助你在关键时刻提高攻击成功率，适合配合击杀或得分目标使用。",
  "timing": "通常在 Power Step 使用，尤其是在你准备进行关键攻击前。",
  "beginner_tip": "不要一抽到就马上使用。先看自己是否马上能攻击、击杀或完成目标。",
  "tags": ["攻击卡", "得分卡"],
  "warband_name": "Unknown",
  "deck_name": "Unknown",
  "format": "Unknown",
  "is_public": true
}
```

---

## 15. UX 重点

### 15.1 对局中快速看懂

玩家页不应该太复杂。玩家通常是在游戏中快速查询，所以 UI 应该：

- 搜索框放最上面
- 卡名明显
- 中文白话解释短
- 使用时机突出显示
- 新手提醒不要太长
- 标签颜色清楚

### 15.2 不干扰对局

CardHelp 是辅助工具，不应该要求玩家在对局中输入资料。

玩家只需要：

1. 打开 CardHelp
2. 搜索英文卡名
3. 看中文解释
4. 回到游戏

---

## 16. 验收标准

完成后必须符合：

- `/host/card-help` 可以新增 CardHelp 资料
- `/host/card-help` 可以编辑 CardHelp 资料
- `/host/card-help` 可以删除 CardHelp 资料
- `/host/card-help` 可以切换 Public / Hidden
- `/card-help` 只显示 Public 资料
- `/card-help` 没有新增、编辑、删除入口
- 玩家可以用英文卡名搜索
- 玩家可以用标签筛选
- mobile layout 可读性良好
- 空状态和无搜索结果状态存在
- 页面有非官方教学辅助免责声明

---

## 17. 推荐开发顺序

1. 建立 `card_help_entries` table
2. 建立 CardHelp types 和 service
3. 完成玩家只读页面 `/card-help`
4. 完成 Host 管理页面 `/host/card-help`
5. 加入新增 / 编辑表单
6. 加入删除确认
7. 加入 Public / Hidden 切换
8. 加入搜索和标签筛选
9. 加入空状态、错误状态、loading 状态
10. Mobile UI polish

---

## 18. Codex 实作要求

请根据本文件实现 CardHelp MVP。

必须遵守：

- 不要实现 OCR
- 不要实现自动翻译
- 不要上传或显示官方卡图
- 不要保存完整官方卡牌文本
- Host 才可以管理资料
- 玩家只能查看公开资料
- UI 必须 mobile friendly
- 保持现有项目的视觉风格和 routing 结构
- 如果项目已有 `/host` layout，请将 CardHelp 管理入口整合进去
- 如果项目已有 Supabase client/service pattern，请复用现有写法
- 如果项目暂无正式 host auth，先使用项目现有 `/host` 保护方式，不要额外引入复杂登录系统
