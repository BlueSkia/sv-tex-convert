<script lang="ts">
  import { isDds, isTex } from '$lib/identify';

  let result = $state('');

  async function handleChange(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const { currentTarget } = e;

    if (currentTarget?.files && currentTarget.files.length > 0) {
      const infile = currentTarget.files[0];
      console.info('file info', infile);

      if (await isDds(infile)) {
        result = 'File is DDS';
      } else if (await isTex(infile)) {
        result = 'File is TEX';
      } else {
        result = 'Some other file type';
      }
    } else {
      result = 'No file';
    }
  }
</script>

<h1>sv-tex-convert</h1>

<div>
  <label>
    <input
      type="file"
      name="infile"
      onchange={handleChange}
    >
    Select your file
  </label>

  <p>
    File data:
  </p>
  <pre>{result}</pre>
</div>
