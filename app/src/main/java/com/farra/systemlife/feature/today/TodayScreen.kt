package com.farra.systemlife.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.farra.systemlife.R
import com.farra.systemlife.ui.components.DedicationCard
import com.farra.systemlife.ui.components.RoyalBackground

@Composable
fun TodayScreen() {
    RoyalBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = "السلام عليكم ورحمة الله",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = "نظرة اليوم — الصلاة القادمة، سلسلة التعافي، ذكر اليوم، وتلاوة البقرة. (تُبنى تفاصيلها في المراحل القادمة)",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            DedicationCard(
                title = stringResource(R.string.dedication_title),
                body = stringResource(R.string.dedication_body),
                sub = stringResource(R.string.dedication_sub),
                dua = stringResource(R.string.dedication_dua),
            )
        }
    }
}
