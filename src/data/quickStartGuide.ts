// Edit this file to customise the Quick Start Guide.
// Hosts can change step titles, summaries, checklist items, details, reminders,
// and warning notes here without editing React components.
export type LocalizedGuideText = {
  en: string;
  zh: string;
};

export type QuickStartStep = {
  id: string;
  title: LocalizedGuideText;
  summary: LocalizedGuideText;
  checklistItems: LocalizedGuideText[];
  details?: LocalizedGuideText[];
  reminders?: LocalizedGuideText[];
  warningNotes?: LocalizedGuideText[];
};

export function getQuickStartItemKey(stepId: string, itemIndex: number) {
  return `${stepId}:${itemIndex}`;
}

export const quickStartGuide = {
  completionMessage: {
    en: "Setup complete. Start Round 1.",
    zh: "设置完成。开始第 1 回合。"
  },
  steps: [
    {
      id: "muster-warbands",
      title: {
        en: "Muster Warbands",
        zh: "集结战帮"
      },
      summary: {
        en: "Choose warbands and Rivals decks, then set the needed pieces within reach.",
        zh: "选择战帮和 Rivals 牌组，并把需要的配件放在手边。"
      },
      checklistItems: [
        {
          en: "Each player picks 1 warband.",
          zh: "每名玩家选择 1 个战帮。"
        },
        {
          en: "Each player picks 1 Rivals deck.",
          zh: "每名玩家选择 1 套 Rivals 牌组。"
        },
        {
          en: "Reveal chosen warbands and decks.",
          zh: "公开所选战帮和牌组。"
        },
        {
          en: "Place fighters, cards, tokens, boards, and decks within reach.",
          zh: "把战士、卡牌、标记、版图和牌组放在手边。"
        },
        {
          en: "Split the Rivals deck into Objective and Power decks.",
          zh: "将 Rivals 牌组分成目标牌组和力量牌组。"
        },
        {
          en: "Put both decks face down.",
          zh: "两叠牌都面朝下放置。"
        }
      ],
      details: [
        {
          en: "Objective cards are used for scoring.",
          zh: "目标牌用于得分。"
        },
        {
          en: "Power cards cover gambits, upgrades, and other plays during the game.",
          zh: "力量牌包含谋略、升级和对局中的其他行动。"
        }
      ]
    },
    {
      id: "draw-starting-hand",
      title: {
        en: "Draw Starting Hand",
        zh: "抽取起始手牌"
      },
      summary: {
        en: "Shuffle both decks separately and draw the starting cards.",
        zh: "分别洗好两叠牌，然后抽取起始手牌。"
      },
      checklistItems: [
        {
          en: "Shuffle Objective deck face down.",
          zh: "目标牌组面朝下洗牌。"
        },
        {
          en: "Shuffle Power deck face down.",
          zh: "力量牌组面朝下洗牌。"
        },
        {
          en: "Draw 3 Objective cards.",
          zh: "抽 3 张目标牌。"
        },
        {
          en: "Draw 5 Power cards.",
          zh: "抽 5 张力量牌。"
        },
        {
          en: "Keep your hand secret from the opponent.",
          zh: "不要让对手看到你的手牌。"
        },
        {
          en: "Decide whether to use the allowed redraw.",
          zh: "决定是否使用允许的重抽。"
        }
      ],
      reminders: [
        {
          en: "A redraw can help when the first hand is hard to play.",
          zh: "如果起手很难展开，重抽可以帮助开局。"
        }
      ]
    },
    {
      id: "determine-territories",
      title: {
        en: "Determine Territories",
        zh: "确定领地"
      },
      summary: {
        en: "Roll off to decide battlefield side and territory.",
        zh: "掷骰决定战场边和领地。"
      },
      checklistItems: [
        {
          en: "Both players roll off.",
          zh: "双方进行掷骰比拼。"
        },
        {
          en: "Winner chooses the battlefield side.",
          zh: "胜者选择战场边。"
        },
        {
          en: "Winner chooses their territory.",
          zh: "胜者选择自己的领地。"
        },
        {
          en: "The other territory belongs to the opponent.",
          zh: "另一片领地归对手。"
        }
      ],
      reminders: [
        {
          en: "Use the official rulebook for unusual roll-off cases.",
          zh: "遇到特殊掷骰情况时，请查阅官方规则书。"
        }
      ]
    },
    {
      id: "place-treasure-tokens",
      title: {
        en: "Place Treasure Tokens",
        zh: "放置宝藏标记"
      },
      summary: {
        en: "Place feature tokens face down, then reveal them after all are placed.",
        zh: "先面朝下放置地形标记，全部放好后再翻开。"
      },
      checklistItems: [
        {
          en: "The player who did not choose territory shuffles the feature tokens face down.",
          zh: "没有选择领地的玩家将地形标记面朝下洗混。"
        },
        {
          en: "That player places the first feature token.",
          zh: "该玩家先放置第一个地形标记。"
        },
        {
          en: "Players alternate placing feature tokens.",
          zh: "双方轮流放置地形标记。"
        },
        {
          en: "Place 5 feature tokens total.",
          zh: "总共放置 5 个地形标记。"
        },
        {
          en: "After all 5 are placed, flip them to the numbered side.",
          zh: "5 个全部放好后，翻到带编号的一面。"
        }
      ],
      warningNotes: [
        {
          en: "Not on starting hexes",
          zh: "不要放在起始格"
        },
        {
          en: "Not on blocked hexes",
          zh: "不要放在阻挡格"
        },
        {
          en: "Not on stagger hexes",
          zh: "不要放在踉跄格"
        },
        {
          en: "Avoid edge hexes unless no legal spot remains",
          zh: "除非没有合法位置，否则避开边缘格"
        },
        {
          en: "Keep 2 hexes away from another feature token",
          zh: "与其他地形标记保持 2 格距离"
        },
        {
          en: "Each territory should have at least 1 feature token",
          zh: "每片领地至少应有 1 个地形标记"
        }
      ]
    },
    {
      id: "place-aqua-ghyranis",
      title: {
        en: "Place Aqua Ghyranis Tokens",
        zh: "放置生命之水标记"
      },
      summary: {
        en: "Each player places 1 Aqua Ghyranis token using the same style as treasure tokens.",
        zh: "每名玩家按宝藏标记的方式放置 1 个生命之水标记。"
      },
      checklistItems: [
        {
          en: "The player who placed the last treasure token places 1 Aqua Ghyranis token.",
          zh: "放置最后一个宝藏标记的玩家先放 1 个生命之水标记。"
        },
        {
          en: "The other player places 1 Aqua Ghyranis token.",
          zh: "另一名玩家再放 1 个生命之水标记。"
        },
        {
          en: "Use the same placement restrictions as treasure tokens.",
          zh: "使用与宝藏标记相同的放置限制。"
        }
      ],
      reminders: [
        {
          en: "Keep this step quick so the table can start playing.",
          zh: "保持这一步简短，让牌桌尽快开局。"
        }
      ]
    },
    {
      id: "deploy-fighters",
      title: {
        en: "Deploy Fighters",
        zh: "部署战士"
      },
      summary: {
        en: "Take turns placing fighters into empty starting hexes in friendly territory.",
        zh: "轮流把战士放入己方领地内的空起始格。"
      },
      checklistItems: [
        {
          en: "Start with the player who placed the final feature token.",
          zh: "由放置最后一个地形标记的玩家先开始。"
        },
        {
          en: "Players alternate placing 1 fighter at a time.",
          zh: "双方轮流每次放置 1 名战士。"
        },
        {
          en: "Use only empty starting hexes in friendly territory.",
          zh: "只能使用己方领地内的空起始格。"
        },
        {
          en: "If one player runs out of fighters, the other player continues.",
          zh: "若一方战士已放完，另一方继续部署。"
        },
        {
          en: "Continue until all fighters are deployed.",
          zh: "直到所有战士都部署完成。"
        }
      ]
    }
  ]
} satisfies {
  completionMessage: LocalizedGuideText;
  steps: QuickStartStep[];
};
