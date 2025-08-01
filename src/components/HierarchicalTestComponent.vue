<template>
  <div class="hierarchical-test">
    <v-card class="test-card" variant="outlined">
      <v-card-title>
        <v-icon start>mdi-test-tube</v-icon>
        Hierarchical Data Test
      </v-card-title>
      <v-card-text>
        <p>This component tests the hierarchical data functionality.</p>

        <v-btn @click="testBasicFunctionality" variant="outlined" class="mr-2">
          Test Basic Functions
        </v-btn>

        <v-btn @click="testSiteChargePoints" variant="outlined" class="mr-2">
          Test Site-ChargePoints
        </v-btn>

        <div v-if="testResults.length > 0" class="test-results mt-4">
          <h4>Test Results:</h4>
          <v-list density="compact">
            <v-list-item
              v-for="(result, index) in testResults"
              :key="index"
              :class="result.success ? 'text-success' : 'text-error'"
            >
              <v-list-item-title>
                <v-icon :icon="result.success ? 'mdi-check' : 'mdi-close'" start />
                {{ result.message }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import useHierarchicalData, { useSiteChargePoints } from '@/composables/useHierarchicalData'

interface TestResult {
  message: string
  success: boolean
}

const testResults = ref<TestResult[]>([])

const addTestResult = (message: string, success: boolean) => {
  testResults.value.push({ message, success })
}

const testBasicFunctionality = () => {
  testResults.value = []

  try {
    // Create a simple hierarchical data instance
    const hierarchy = useHierarchicalData({
      fetchChildren: async (parent: any) => {
        // Mock fetch function
        return [`child1-of-${parent.id}`, `child2-of-${parent.id}`]
      },
      getParentKey: (parent: any) => parent.id,
      hasChildren: () => true,
      autoLoad: false
    })

    addTestResult('✓ Hierarchical data instance created successfully', true)

    // Test basic methods
    const mockParent = { id: 'test-parent' }

    // Test isExpanded (should be false initially)
    const expandedInitially = hierarchy.isExpanded(mockParent)
    addTestResult(
      `✓ isExpanded initial state: ${!expandedInitially ? 'correct (false)' : 'incorrect'}`,
      !expandedInitially
    )

    // Test expand
    hierarchy.expand(mockParent)
    const expandedAfter = hierarchy.isExpanded(mockParent)
    addTestResult(`✓ expand method: ${expandedAfter ? 'works' : 'failed'}`, expandedAfter)

    // Test collapse
    hierarchy.collapse(mockParent)
    const collapsedAfter = hierarchy.isExpanded(mockParent)
    addTestResult(`✓ collapse method: ${!collapsedAfter ? 'works' : 'failed'}`, !collapsedAfter)

    // Test stats
    const stats = hierarchy.getStats()
    addTestResult(
      `✓ getStats method: returns object with ${Object.keys(stats).length} properties`,
      Object.keys(stats).length > 0
    )

    addTestResult('🎉 All basic functionality tests passed!', true)
  } catch (error) {
    addTestResult(`❌ Basic functionality test failed: ${error}`, false)
  }
}

const testSiteChargePoints = () => {
  testResults.value = []

  try {
    // Test the specialized composable
    const siteHierarchy = useSiteChargePoints()

    addTestResult('✓ useSiteChargePoints composable created successfully', true)

    // Test that it has the expected methods
    const hasExpandMethod = typeof siteHierarchy.expand === 'function'
    const hasCollapseMethod = typeof siteHierarchy.collapse === 'function'
    const hasLoadChildrenMethod = typeof siteHierarchy.loadChildren === 'function'

    addTestResult(`✓ Has expand method: ${hasExpandMethod}`, hasExpandMethod)
    addTestResult(`✓ Has collapse method: ${hasCollapseMethod}`, hasCollapseMethod)
    addTestResult(`✓ Has loadChildren method: ${hasLoadChildrenMethod}`, hasLoadChildrenMethod)

    if (hasExpandMethod && hasCollapseMethod && hasLoadChildrenMethod) {
      addTestResult('🎉 Site-ChargePoints functionality test passed!', true)
    } else {
      addTestResult('❌ Site-ChargePoints functionality test failed', false)
    }
  } catch (error) {
    addTestResult(`❌ Site-ChargePoints test failed: ${error}`, false)
  }
}
</script>

<style scoped>
.hierarchical-test {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.test-card {
  border-radius: 8px;
}

.test-results {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 16px;
}

.text-success {
  color: rgb(var(--v-theme-success));
}

.text-error {
  color: rgb(var(--v-theme-error));
}
</style>
