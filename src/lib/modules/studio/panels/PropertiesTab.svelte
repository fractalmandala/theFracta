<!-- ═══════════════════════════════════════════════════════
     PropertiesTab — CSS property editor (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import { properties } from '$lib/modules/studio/studioconfig';
  import { AC_DATA } from '$lib/modules/studio/data';
  import Section from '../shared/Section.svelte';
  import PropertyRow from '../shared/PropertyRow.svelte';
  import SliderRow from '../shared/SliderRow.svelte';
  import ColorRow from '../shared/ColorRow.svelte';

  function handlePropChange(e: { prop: string; value: string }) {
    const { prop, value } = e;
    properties.update((p) => ({ ...p, [prop]: value }));
  }

  function handleSliderChange(prop: string, val: number) {
    const unit = prop === 'iterations' ? '' : 'px';
    properties.update((p) => ({ ...p, [prop]: `${val}${unit}` }));
  }

  function handleColorChange(prop: string, val: string) {
    properties.update((p) => ({ ...p, [prop]: val }));
  }
</script>

<Section label="Layout">
  <PropertyRow label="display" prop="display" placeholder="flex" suggestions={AC_DATA.display} value={(($properties as Record<string, string>).display) || ''} onchange={handlePropChange} />
  <PropertyRow label="flex-direction" prop="flex-direction" placeholder="row" suggestions={AC_DATA['flex-direction']} value={(($properties as Record<string, string>)['flex-direction']) || ''} onchange={handlePropChange} />
  <PropertyRow label="gap" prop="gap" placeholder="8px" suggestions={AC_DATA.gap} value={(($properties as Record<string, string>).gap) || ''} onchange={handlePropChange} />
  <PropertyRow label="justify-content" prop="justify-content" placeholder="center" suggestions={AC_DATA['justify-content']} value={(($properties as Record<string, string>)['justify-content']) || ''} onchange={handlePropChange} />
  <PropertyRow label="align-items" prop="align-items" placeholder="center" suggestions={AC_DATA['align-items']} value={(($properties as Record<string, string>)['align-items']) || ''} onchange={handlePropChange} />
  <PropertyRow label="grid-template-columns" prop="grid-template-columns" placeholder="1fr 1fr" suggestions={AC_DATA['grid-template-columns']} value={(($properties as Record<string, string>)['grid-template-columns']) || ''} onchange={handlePropChange} />
</Section>

<Section label="Spacing">
  <SliderRow label="padding" min={0} max={80} value={parseInt((($properties as Record<string, string>).padding) || '') || 24} onchange={(val: number) => handleSliderChange('padding', val)} />
  <SliderRow label="margin" min={0} max={80} value={parseInt((($properties as Record<string, string>).margin) || '') || 0} onchange={(val: number) => handleSliderChange('margin', val)} />
  <SliderRow label="border-radius" min={0} max={50} value={parseInt((($properties as Record<string, string>)['border-radius']) || '') || 10} onchange={(val: number) => handleSliderChange('border-radius', val)} />
</Section>

<Section label="Size">
  <SliderRow label="width" min={40} max={600} value={parseInt((($properties as Record<string, string>).width) || '') || 200} onchange={(val: number) => handleSliderChange('width', val)} />
  <SliderRow label="height" min={40} max={400} value={parseInt((($properties as Record<string, string>).height) || '') || 120} onchange={(val: number) => handleSliderChange('height', val)} />
</Section>

<Section label="Typography">
  <PropertyRow label="font-size" prop="font-size" placeholder="14px" suggestions={AC_DATA['font-size']} value={(($properties as Record<string, string>)['font-size']) || ''} onchange={handlePropChange} />
  <PropertyRow label="font-weight" prop="font-weight" placeholder="400" suggestions={AC_DATA['font-weight']} value={(($properties as Record<string, string>)['font-weight']) || ''} onchange={handlePropChange} />
  <PropertyRow label="text-align" prop="text-align" placeholder="center" suggestions={AC_DATA['text-align']} value={(($properties as Record<string, string>)['text-align']) || ''} onchange={handlePropChange} />
  <PropertyRow label="letter-spacing" prop="letter-spacing" placeholder="0.02em" suggestions={AC_DATA['letter-spacing']} value={(($properties as Record<string, string>)['letter-spacing']) || ''} onchange={handlePropChange} />
  <PropertyRow label="line-height" prop="line-height" placeholder="1.5" suggestions={AC_DATA['line-height']} value={(($properties as Record<string, string>)['line-height']) || ''} onchange={handlePropChange} />
</Section>

<Section label="Visual">
  <ColorRow label="background" value={(($properties as Record<string, string>).background) || '#2a2a3a'} onchange={(val: string) => handleColorChange('background', val)} />
  <ColorRow label="color" value={(($properties as Record<string, string>).color) || '#e8e8f0'} onchange={(val: string) => handleColorChange('color', val)} />
  <PropertyRow label="border" prop="border" placeholder="1px solid #333" suggestions={AC_DATA.border} value={(($properties as Record<string, string>).border) || ''} onchange={handlePropChange} />
  <PropertyRow label="box-shadow" prop="box-shadow" placeholder="0 4px 12px rgba(0,0,0,0.3)" suggestions={AC_DATA['box-shadow']} value={(($properties as Record<string, string>)['box-shadow']) || ''} onchange={handlePropChange} />
  <PropertyRow label="opacity" prop="opacity" placeholder="1" suggestions={AC_DATA.opacity} value={(($properties as Record<string, string>).opacity) || ''} onchange={handlePropChange} />
  <PropertyRow label="transform" prop="transform" placeholder="scale(1)" suggestions={AC_DATA.transform} value={(($properties as Record<string, string>).transform) || ''} onchange={handlePropChange} />
</Section>

<Section label="Transition">
  <PropertyRow label="transition" prop="transition" placeholder="all 0.3s ease" suggestions={AC_DATA.transition} value={(($properties as Record<string, string>).transition) || ''} onchange={handlePropChange} />
</Section>
