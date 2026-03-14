<script lang="ts">
  import { ddsToTex } from '$lib/convert/dds-to-tex';
  import { texToDds } from '$lib/convert/tex-to-dds';
  import { getDdsInfo } from '$lib/dds-info';
  import { isDds, isTex } from '$lib/identify';
  import { getTexInfo } from '$lib/tex-info';
  import { filenameComponents } from '$lib/utils/file';

  let result = $state('');
  let resultType = $state('');

  let converted = $state('');
  let targetType = $state('');

  let readError = $state('');
  let conversionError = $state('');

  let file = $state<File | null>(null);

  let blobUrl: string | null = $state('');
  let blobFilename = $state('');

  async function handleChange(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const { currentTarget } = e;

    converted = '';
    targetType = '';
    readError = '';
    conversionError = '';

    if (currentTarget?.files && currentTarget.files.length > 0) {
      const infile = currentTarget.files[0];
      file = infile;

      try {
        if (await isDds(infile)) {
          const { header, headerDxt10 } = await getDdsInfo(infile);
          console.info({ header, headerDxt10 });
          result = JSON.stringify({ header, headerDxt10 }, null, 2);
          resultType = 'DDS';
        } else if (await isTex(infile)) {
          const { header } = await getTexInfo(infile);
          console.info({ header });
          result = JSON.stringify({ header }, null, 2);
          resultType = 'TEX';
        } else {
          result = 'Some other file type';
          resultType = 'DUNNO';
        }
      } catch (e) {
        readError = `${e}`;
      }
    } else {
      result = 'No file';
      resultType = '';
      file = null;
    }
  }

  async function convertFile() {
    conversionError = '';

    if (file) {
      console.info('Attempting conversion');
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
        blobFilename = '';
      }

      const { basename } = filenameComponents(file);

      try {
        if (await isTex(file)) {
          console.info('Tex file');
          targetType = 'DDS';
          const { header, headerDxt10, data } = await texToDds(file);
          console.info({ header, headerDxt10 });
          converted = JSON.stringify({ header, headerDxt10 }, null, 2);

          const downloadBlob = new Blob(data, { type: 'application/octet-stream'});
          const url = URL.createObjectURL(downloadBlob);
          blobUrl = url;
          blobFilename = `${basename}.dds`;
        }

        if (await isDds(file)) {
          console.info('DDS file');
          targetType = 'TEX';
          const { header, data } = await ddsToTex(file);
          console.info(header);
          converted = JSON.stringify(header, null, 2);

          const downloadBlob = new Blob(data, { type: 'application/octet-stream' });
          const url = URL.createObjectURL(downloadBlob);
          blobUrl = url;
          blobFilename = `${basename}.tex`;
        }
      } catch (e) {
        conversionError = `${e}`;
      }
    }
  }
</script>

<h1 class="text-2xl text-center font-bold my-2">
  sv-tex-convert
</h1>

<div>
  <p>
    <label>
      <input
        class="border-2 border-slate-500 rounded-md bg-slate-200 px-2"
        type="file"
        name="infile"
        onchange={handleChange}
      >
      Select your file (DDS or tex)
    </label>

    <button
      class="border-2 border-slate-500 rounded-md bg-slate-200 px-2"
      onclick={convertFile}
    >
      Convert
    </button>

    <br/>

    * Only DDS to tex. BC5 still in progress.
  </p>

  <div class="outcols grid grid-cols-2 gap-2">
    <div
      class={{
        'bg-emerald-100': resultType === 'DDS',
        'bg-pink-100': resultType === 'TEX',
      }}
    >
      {#if readError}
        <p class="text-red-500">{readError}</p>
      {/if}
      {#if result}
        <p>
          File data (type {resultType}):
        </p>
        <pre>{result}</pre>
      {/if}
    </div>
    <div
      class={{
        'bg-emerald-100': targetType === 'DDS',
        'bg-pink-100': targetType === 'TEX',
      }}
    >
      {#if conversionError}
        <p class="text-red-500">{conversionError}</p>
      {/if}
      {#if converted}
        <p>
          Converting to {targetType}.
          <a
            class='font-bold text-purple-700'
            href={blobUrl}
            download={blobFilename}
          >
            Download
          </a>
        </p>
        <pre>{converted}</pre>
      {/if}
    </div>
  </div>
</div>
