import { Box, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ludoratory from '../assets/ludoratory.svg';

// Shared studio footer, mirroring the krimi / colorlition pattern:
// Ludoratory attribution + game license + the OpenMoji credit the black
// emoji set requires (CC BY-SA 4.0).

export default function PageFooter() {
  const { t } = useTranslation();
  return (
    <Stack
      component="footer"
      direction="row"
      spacing={1.75}
      sx={{
        alignItems: 'center',
        color: 'text.secondary',
        pt: 2.5,
        mt: 3,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Box
        component="img"
        src={ludoratory}
        alt="Ludoratory"
        sx={{ width: 30, flex: 'none', opacity: 0.7, filter: 'brightness(0) invert(1)' }}
      />
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
          {t('footer.madeBy')}
          <Link href="https://ludoratory.com" target="_blank" rel="noopener noreferrer" sx={{ color: 'inherit' }}>
            {t('footer.madeByLink')}
          </Link>
          {t('footer.madeBySuffix')}
          {t('footer.license')}
          <Link
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'inherit' }}
          >
            {t('footer.licenseLink')}
          </Link>
          {t('footer.licenseSuffix')}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.45, opacity: 0.8 }}>
          {t('footer.emojiBy')}
          <Link href="https://openmoji.org/" target="_blank" rel="noopener noreferrer" sx={{ color: 'inherit' }}>
            {t('footer.emojiLink')}
          </Link>
          {t('footer.emojiSuffix')}
        </Typography>
      </Stack>
    </Stack>
  );
}
