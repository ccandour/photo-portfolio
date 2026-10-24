<script lang="ts">
  import { enhance } from '$app/forms';
  import { beforeNavigate } from '$app/navigation';

  /** Value serialised into the `payload` field on submit */
  export let payload: unknown;
  export let dirty = false;
  export let form: { error?: string; saved?: boolean } | null;

  let saving = false;

  beforeNavigate(({ cancel, type }) => {
    if (dirty && type !== 'leave' && !confirm('You have unsaved changes. Leave anyway?')) cancel();
  });
</script>

<svelte:window on:beforeunload={(e) => { if (dirty) e.preventDefault(); }} />

<form
  method="POST"
  class="sticky-save"
  use:enhance={() => {
    saving = true;
    return async ({ result, update }) => {
      saving = false;
      if (result.type === 'success') dirty = false;
      await update({ reset: false, invalidateAll: false });
    };
  }}
>
  <input type="hidden" name="payload" value={JSON.stringify(payload)} />
  <button class="btn primary" type="submit" disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save changes'}</button>
  {#if dirty}
    <span class="muted">Unsaved changes</span>
  {:else if form?.saved}
    <span class="muted">Saved — live on the site</span>
  {/if}
  {#if form?.error}<span class="message error" style="margin: 0">{form.error}</span>{/if}
</form>
