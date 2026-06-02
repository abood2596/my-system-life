package com.farra.systemlife.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.farra.systemlife.ui.theme.CardBorder
import com.farra.systemlife.ui.theme.EmeraldDeepest
import com.farra.systemlife.ui.theme.GoldLight
import com.farra.systemlife.ui.theme.MidnightEmerald
import com.farra.systemlife.ui.theme.RoyalGold

@Composable
fun royalGradient(): Brush = Brush.verticalGradient(
    listOf(EmeraldDeepest, MidnightEmerald, MaterialTheme.colorScheme.surface),
)

@Composable
fun goldGradient(): Brush = Brush.horizontalGradient(listOf(RoyalGold, GoldLight))

/** خلفية الشاشة الأساسية بالتدرّج الملكي. */
@Composable
fun RoyalBackground(content: @Composable () -> Unit) {
    Box(Modifier.fillMaxSize().background(royalGradient())) { content() }
}

/** عنوان قسم بخط ذهبي. */
@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
        modifier = modifier,
    )
}

/** بطاقة أنيقة بحافة ذهبية خفيفة. */
@Composable
fun GoldCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, CardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) { content() }
}

/** مقياس مصغّر: رقم كبير + تسمية. */
@Composable
fun MetricTile(value: String, label: String, modifier: Modifier = Modifier, accent: Color = RoyalGold) {
    GoldCard(modifier = modifier) {
        Column(
            Modifier.fillMaxWidth().padding(vertical = 16.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = accent)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        }
    }
}

/** عدّاد دائري كبير بحلقة تقدّم. */
@Composable
fun CircularCounter(
    value: Int,
    target: Int,
    label: String,
    modifier: Modifier = Modifier,
) {
    val progress = if (target > 0) (value.toFloat() / target).coerceIn(0f, 1f) else 0f
    val ring = MaterialTheme.colorScheme.primary
    val track = MaterialTheme.colorScheme.surfaceVariant
    Box(modifier = modifier.size(220.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val stroke = 18.dp.toPx()
            val inset = stroke / 2
            val arcSize = androidx.compose.ui.geometry.Size(size.width - stroke, size.height - stroke)
            val topLeft = Offset(inset, inset)
            drawArc(track, 0f, 360f, false, topLeft = topLeft, size = arcSize, style = Stroke(stroke, cap = StrokeCap.Round))
            drawArc(ring, -90f, 360f * progress, false, topLeft = topLeft, size = arcSize, style = Stroke(stroke, cap = StrokeCap.Round))
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("$value", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

/** مخطط خطي بسيط (Canvas) لقيم متسلسلة. */
@Composable
fun SimpleLineChart(values: List<Float>, modifier: Modifier = Modifier) {
    val line = MaterialTheme.colorScheme.primary
    val fill = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
    Canvas(modifier = modifier.fillMaxWidth().height(160.dp).padding(8.dp)) {
        if (values.size < 2) return@Canvas
        val maxV = (values.maxOrNull() ?: 1f).coerceAtLeast(1f)
        val stepX = size.width / (values.size - 1)
        val pts = values.mapIndexed { i, v ->
            Offset(i * stepX, size.height - (v / maxV) * size.height)
        }
        for (i in 0 until pts.size - 1) {
            drawLine(line, pts[i], pts[i + 1], strokeWidth = 5f, cap = StrokeCap.Round)
        }
        pts.forEach { drawCircle(line, radius = 7f, center = it) }
    }
}

/** شاشة مبدئية أنيقة للوحدات قيد الإنجاز. */
@Composable
fun PlaceholderScreen(title: String, subtitle: String, icon: String = "✦") {
    RoyalBackground {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(icon, style = MaterialTheme.typography.displaySmall, color = RoyalGold)
            Text(title, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = RoyalGold, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
            Text(subtitle, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
        }
    }
}

/** بطاقة الإهداء — صدقة جارية عن روح الشهيد زهير الفرا. */
@Composable
fun DedicationCard(
    title: String,
    body: String,
    sub: String,
    dua: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, CardBorder),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
    ) {
        Box(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp))
                .background(Brush.verticalGradient(listOf(MidnightEmerald, MaterialTheme.colorScheme.surface)))
                .padding(20.dp),
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = RoyalGold, textAlign = TextAlign.Center)
                Text(body, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface, textAlign = TextAlign.Center)
                Text(sub, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
                Text(dua, style = MaterialTheme.typography.titleMedium, color = GoldLight, textAlign = TextAlign.Center)
            }
        }
    }
}
