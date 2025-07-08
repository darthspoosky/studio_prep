{
    "dashboardSpecification": {
      "version": "2.0",
      "layouts": {
        "desktop": {
          "type": "grid",
          "columns": 12,
          "gap": 24,
          "sections": [
            {
              "id": "header",
              "gridArea": "1 / 1 / 2 / 13",
              "components": ["userGreeting", "quickActions", "notifications"]
            },
            {
              "id": "mainMetrics",
              "gridArea": "2 / 1 / 3 / 9",
              "components": ["performanceOverview", "streakCounter", "progressMeter"]
            },
            {
              "id": "sidePanel",
              "gridArea": "2 / 9 / 5 / 13",
              "components": ["dailyGoals", "schedule", "recommendations"]
            },
            {
              "id": "analytics",
              "gridArea": "3 / 1 / 4 / 9",
              "components": ["interactiveCharts", "insightsPanel"]
            },
            {
              "id": "activity",
              "gridArea": "4 / 1 / 5 / 9",
              "components": ["activityTimeline", "recentAchievements"]
            }
          ]
        },
        "tablet": {
          "type": "flex",
          "direction": "column",
          "sections": [
            {
              "id": "header",
              "components": ["userGreeting", "notifications"]
            },
            {
              "id": "metrics",
              "type": "grid",
              "columns": 2,
              "components": ["performanceOverview", "streakCounter", "progressMeter", "dailyGoals"]
            },
            {
              "id": "charts",
              "components": ["interactiveCharts"]
            },
            {
              "id": "activity",
              "components": ["activityTimeline", "schedule"]
            }
          ]
        },
        "mobile": {
          "type": "stack",
          "sections": [
            {
              "id": "header",
              "sticky": true,
              "components": ["mobileHeader", "quickStats"]
            },
            {
              "id": "swipeableCards",
              "type": "carousel",
              "components": ["performanceCard", "streakCard", "goalCard", "insightCard"]
            },
            {
              "id": "content",
              "components": ["activityTimeline", "chartsMini"]
            }
          ]
        }
      },
      "widgets": {
        "performanceOverview": {
          "type": "composite",
          "title": "Performance Overview",
          "refreshInterval": 30000,
          "components": [
            {
              "id": "accuracyGauge",
              "type": "radialGauge",
              "props": {
                "value": "{{stats.overallAccuracy}}",
                "max": 100,
                "thresholds": [
                  { "value": 0, "color": "#EF4444" },
                  { "value": 50, "color": "#F59E0B" },
                  { "value": 75, "color": "#10B981" }
                ],
                "animation": {
                  "duration": 1000,
                  "easing": "easeOutCubic"
                }
              }
            },
            {
              "id": "performanceTrend",
              "type": "sparkline",
              "props": {
                "data": "{{stats.weeklyAccuracy}}",
                "color": "gradient",
                "showArea": true,
                "interactive": true
              }
            },
            {
              "id": "subjectBreakdown",
              "type": "horizontalBar",
              "props": {
                "data": "{{stats.subjectPerformance}}",
                "sortable": true,
                "clickable": true,
                "actions": {
                  "onClick": "navigateToSubject"
                }
              }
            }
          ]
        },
        "streakCounter": {
          "type": "animated",
          "title": "Study Streak",
          "components": [
            {
              "id": "currentStreak",
              "type": "counter",
              "props": {
                "value": "{{user.currentStreak}}",
                "suffix": "days",
                "animation": "countUp",
                "icon": "flame",
                "color": "{{user.currentStreak > 7 ? 'orange' : 'gray'}}"
              }
            },
            {
              "id": "streakCalendar",
              "type": "heatmap",
              "props": {
                "data": "{{user.activityHistory}}",
                "period": "last3Months",
                "interactive": true,
                "tooltip": {
                  "format": "{{date}}: {{duration}} studied"
                }
              }
            }
          ]
        },
        "dailyGoals": {
          "type": "interactive",
          "title": "Today's Goals",
          "editable": true,
          "components": [
            {
              "id": "goalsList",
              "type": "checklist",
              "props": {
                "items": "{{user.dailyGoals}}",
                "sortable": true,
                "animations": {
                  "onComplete": "confetti",
                  "onAdd": "slideIn",
                  "onRemove": "fadeOut"
                }
              }
            },
            {
              "id": "progressRing",
              "type": "progressRing",
              "props": {
                "value": "{{goals.completionPercentage}}",
                "segments": "{{goals.categories}}",
                "interactive": true
              }
            }
          ]
        },
        "interactiveCharts": {
          "type": "tabbed",
          "title": "Analytics",
          "tabs": [
            {
              "id": "performance",
              "label": "Performance",
              "charts": [
                {
                  "type": "line",
                  "data": "{{analytics.performanceOverTime}}",
                  "options": {
                    "zoom": true,
                    "brush": true,
                    "annotations": "{{analytics.milestones}}"
                  }
                }
              ]
            },
            {
              "id": "subjects",
              "label": "Subjects",
              "charts": [
                {
                  "type": "radar",
                  "data": "{{analytics.subjectStrengths}}",
                  "interactive": true,
                  "drillDown": true
                }
              ]
            },
            {
              "id": "timeAnalysis",
              "label": "Time Analysis",
              "charts": [
                {
                  "type": "sunburst",
                  "data": "{{analytics.timeDistribution}}",
                  "interactive": true,
                  "tooltip": "detailed"
                }
              ]
            }
          ]
        },
        "recommendations": {
          "type": "ai-powered",
          "title": "Smart Recommendations",
          "refreshInterval": 3600000,
          "components": [
            {
              "id": "nextTopic",
              "type": "card",
              "props": {
                "title": "Recommended Next",
                "content": "{{ai.recommendedTopic}}",
                "reason": "{{ai.recommendationReason}}",
                "actions": [
                  {
                    "label": "Start Now",
                    "action": "startRecommended"
                  },
                  {
                    "label": "See Alternatives",
                    "action": "showAlternatives"
                  }
                ]
              }
            },
            {
              "id": "weakAreaAlert",
              "type": "alert",
              "props": {
                "condition": "{{ai.weakAreaDetected}}",
                "severity": "{{ai.weakAreaSeverity}}",
                "message": "{{ai.weakAreaMessage}}",
                "actions": "{{ai.suggestedActions}}"
              }
            }
          ]
        },
        "activityTimeline": {
          "type": "timeline",
          "title": "Recent Activity",
          "virtualScroll": true,
          "components": [
            {
              "id": "timelineItems",
              "type": "list",
              "props": {
                "data": "{{activity.recent}}",
                "groupBy": "date",
                "itemTemplate": {
                  "icon": "{{item.type}}",
                  "title": "{{item.title}}",
                  "subtitle": "{{item.details}}",
                  "timestamp": "{{item.time}}",
                  "actions": "{{item.actions}}"
                },
                "animations": {
                  "onLoad": "stagger",
                  "onScroll": "fadeIn"
                }
              }
            }
          ]
        }
      },
      "interactions": {
        "dragAndDrop": {
          "enabled": true,
          "zones": ["mainMetrics", "sidePanel"],
          "onDrop": "saveLayoutPreference"
        },
        "gestures": {
          "swipe": {
            "mobile": true,
            "actions": {
              "left": "nextCard",
              "right": "previousCard",
              "up": "expandDetails",
              "down": "collapse"
            }
          },
          "pinch": {
            "charts": true,
            "action": "zoom"
          }
        },
        "shortcuts": {
          "keyboard": {
            "cmd+k": "openCommandPalette",
            "cmd+/": "toggleHelp",
            "esc": "closeModal"
          }
        }
      },
      "animations": {
        "pageTransitions": {
          "type": "smooth",
          "duration": 300,
          "easing": "easeInOutCubic"
        },
        "widgetAnimations": {
          "onMount": {
            "type": "fadeInUp",
            "stagger": 50,
            "duration": 400
          },
          "onInteraction": {
            "hover": "scale(1.02)",
            "click": "pulse"
          }
        },
        "dataUpdates": {
          "numbers": "countUp",
          "charts": "morphing",
          "lists": "slideIn"
        }
      },
      "themes": {
        "light": {
          "primary": "#5347CE",
          "secondary": "#7C3AED",
          "accent": "#EC4899",
          "background": "#FFFFFF",
          "surface": "#F3F4F6",
          "text": "#111827"
        },
        "dark": {
          "primary": "#6366F1",
          "secondary": "#8B5CF6",
          "accent": "#F472B6",
          "background": "#0F172A",
          "surface": "#1E293B",
          "text": "#F1F5F9"
        },
        "customization": {
          "allowUserThemes": true,
          "colorBlindModes": ["protanopia", "deuteranopia", "tritanopia"]
        }
      },
      "accessibility": {
        "aria": {
          "landmarks": true,
          "liveRegions": ["notifications", "updates"],
          "announcements": true
        },
        "keyboard": {
          "fullyNavigable": true,
          "focusIndicators": "visible",
          "skipLinks": true
        },
        "screen_reader": {
          "optimized": true,
          "altText": "comprehensive",
          "descriptions": "contextual"
        }
      },
      "performance": {
        "lazyLoading": {
          "widgets": true,
          "threshold": 0.1,
          "rootMargin": "50px"
        },
        "caching": {
          "strategy": "stale-while-revalidate",
          "duration": 300000,
          "invalidation": "smart"
        },
        "rendering": {
          "virtualization": true,
          "batchUpdates": true,
          "debounce": 250
        }
      }
    }
  }