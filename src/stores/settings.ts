import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ExamSettingsConfig } from '../types';

export const useSettingsStore = defineStore('settings', () => {
  const config = ref<ExamSettingsConfig>({
    officialCount: parseInt(localStorage.getItem('ewc_official_count') || '30', 10),
    spellRatio: parseFloat(localStorage.getItem('ewc_spell_ratio') || '0.5'),
    timeLimitMode: (localStorage.getItem('ewc_time_limit_mode') || 'total') as any,
    totalMinutes: parseInt(localStorage.getItem('ewc_total_minutes') || '15', 10),
    perQuestionSeconds: parseInt(localStorage.getItem('ewc_per_q_seconds') || '20', 10),
    autoSpeak: localStorage.getItem('ewc_auto_speak') !== 'false',
    speechRate: parseFloat(localStorage.getItem('ewc_speech_rate') || '0.85'),
    requireExactCase: localStorage.getItem('ewc_require_case') !== 'false', // Default true per user rule
    gasUrl: localStorage.getItem('ewc_custom_gas_url') || '',
    gasToken: localStorage.getItem('ewc_custom_gas_token') || ''
  });

  const parentPinHash = ref<string>(localStorage.getItem('ewc_parent_pin_hash') || '');

  function saveConfig(newConfig: Partial<ExamSettingsConfig>) {
    config.value = { ...config.value, ...newConfig };
    localStorage.setItem('ewc_official_count', String(config.value.officialCount));
    localStorage.setItem('ewc_spell_ratio', String(config.value.spellRatio));
    localStorage.setItem('ewc_time_limit_mode', config.value.timeLimitMode);
    localStorage.setItem('ewc_total_minutes', String(config.value.totalMinutes));
    localStorage.setItem('ewc_per_q_seconds', String(config.value.perQuestionSeconds));
    localStorage.setItem('ewc_auto_speak', String(config.value.autoSpeak));
    localStorage.setItem('ewc_speech_rate', String(config.value.speechRate));
    localStorage.setItem('ewc_require_case', String(config.value.requireExactCase));
    if (newConfig.gasUrl !== undefined) localStorage.setItem('ewc_custom_gas_url', newConfig.gasUrl);
    if (newConfig.gasToken !== undefined) localStorage.setItem('ewc_custom_gas_token', newConfig.gasToken);
  }

  function setParentPin(pin: string) {
    localStorage.setItem('ewc_parent_pin_hash', pin);
    parentPinHash.value = pin;
  }

  function verifyParentPin(pin: string): boolean {
    const saved = localStorage.getItem('ewc_parent_pin_hash') || '8888';
    return pin === saved;
  }

  return {
    config,
    saveConfig,
    setParentPin,
    verifyParentPin
  };
});
