tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '#36D6B5',
            electric: '#00D9FF',
            darkBg: '#0F1B3C',
            darkCard: '#1a2847',
            accentBlue: '#0066FF'
          },
          boxShadow: {
            soft: '0 10px 30px rgba(0,0,0,.3)',
            glow: '0 0 20px rgba(0, 217, 255, 0.3)',
            neon: '0 0 20px rgba(0, 217, 255, 0.2)'
          }
        }
      }
    };

(function () {
      const saved = localStorage.getItem('theme');
      if (saved === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    })();